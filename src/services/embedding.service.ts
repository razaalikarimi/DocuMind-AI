import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Embedding } from "@/lib/models";
import { generateEmbedding, generateEmbeddingsBatch } from "@/lib/openai";
import { RAG_CONFIG, VECTOR_SEARCH } from "@/constants";
import type { TextChunk } from "./pdf.service";


export interface SimilarChunk {
  content: string;
  score: number;
  metadata: {
    page: number;
    chunk: number;
    source: string;
    pdfName: string;
    pdfId: string;
  };
}

// =============================================================================
// STORE EMBEDDINGS IN MONGODB
// =============================================================================

export async function storeEmbeddings(
  chunks: TextChunk[],
  pdfId: string,
  workspaceId: string,
  userId: string
): Promise<void> {
  await connectToDatabase();

  const texts = chunks.map((c) => c.content);
  const embeddings = await generateEmbeddingsBatch(texts);

  const documents = chunks.map((chunk, index) => ({
    pdfId: new mongoose.Types.ObjectId(pdfId),
    workspaceId: new mongoose.Types.ObjectId(workspaceId),
    userId: new mongoose.Types.ObjectId(userId),
    content: chunk.content,
    embedding: embeddings[index],
    metadata: chunk.metadata,
  }));

  // Bulk insert in batches of 500
  const BATCH_SIZE = 500;
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    await Embedding.insertMany(batch, { ordered: false });
  }

  console.log(`[Embedding] Stored ${documents.length} embeddings for PDF ${pdfId}`);
}

// =============================================================================
// VECTOR SIMILARITY SEARCH
// =============================================================================

export async function vectorSearch(
  query: string,
  workspaceId: string,
  pdfIds?: string[],
  topK: number = RAG_CONFIG.topK
): Promise<SimilarChunk[]> {
  await connectToDatabase();

  const queryEmbedding = await generateEmbedding(query);

  // Build match filter
  const matchFilter: Record<string, unknown> = {
    workspaceId: new mongoose.Types.ObjectId(workspaceId),
  };

  if (pdfIds && pdfIds.length > 0) {
    matchFilter.pdfId = {
      $in: pdfIds.map((id) => new mongoose.Types.ObjectId(id)),
    };
  }

  // MongoDB Atlas Vector Search aggregation
  const results = await Embedding.aggregate([
    {
      $vectorSearch: {
        index: VECTOR_SEARCH.indexName,
        path: VECTOR_SEARCH.embeddingField,
        queryVector: queryEmbedding,
        numCandidates: topK * 10, // Over-fetch for re-ranking
        limit: topK,
        filter: matchFilter,
      },
    },
    {
      $project: {
        content: 1,
        metadata: 1,
        pdfId: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ]);

  return results
    .filter((r) => r.score >= RAG_CONFIG.similarityThreshold)
    .map((r) => ({
      content: r.content,
      score: r.score,
      metadata: {
        ...r.metadata,
        pdfId: r.pdfId.toString(),
      },
    }));
}

// =============================================================================
// HYBRID SEARCH (Vector + Keyword)
// =============================================================================

export async function hybridSearch(
  query: string,
  workspaceId: string,
  pdfIds?: string[],
  topK: number = RAG_CONFIG.topK
): Promise<SimilarChunk[]> {
  // Run vector search and keyword search in parallel
  const [vectorResults, keywordResults] = await Promise.all([
    vectorSearch(query, workspaceId, pdfIds, topK),
    keywordSearch(query, workspaceId, pdfIds, Math.floor(topK / 2)),
  ]);

  // Merge and deduplicate by content hash
  const seen = new Set<string>();
  const merged: SimilarChunk[] = [];

  for (const result of [...vectorResults, ...keywordResults]) {
    const key = result.content.substring(0, 100);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(result);
    }
  }

  // Sort by score descending
  return merged.sort((a, b) => b.score - a.score).slice(0, topK);
}

// =============================================================================
// KEYWORD SEARCH
// =============================================================================

async function keywordSearch(
  query: string,
  workspaceId: string,
  pdfIds?: string[],
  limit: number = 4
): Promise<SimilarChunk[]> {
  await connectToDatabase();

  const matchFilter: Record<string, unknown> = {
    workspaceId: new mongoose.Types.ObjectId(workspaceId),
    $text: { $search: query },
  };

  if (pdfIds && pdfIds.length > 0) {
    matchFilter.pdfId = {
      $in: pdfIds.map((id) => new mongoose.Types.ObjectId(id)),
    };
  }

  try {
    const results = await Embedding.find(matchFilter, {
      score: { $meta: "textScore" },
    })
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .lean();

    return results.map((r) => ({
      content: r.content,
      score: 0.5, // Normalized keyword score
      metadata: {
        ...r.metadata,
        pdfId: r.pdfId.toString(),
      },
    }));
  } catch {
    // Text index might not exist; return empty
    return [];
  }
}

// =============================================================================
// DELETE EMBEDDINGS FOR PDF
// =============================================================================

export async function deleteEmbeddingsForPDF(pdfId: string): Promise<void> {
  await connectToDatabase();
  await Embedding.deleteMany({ pdfId: new mongoose.Types.ObjectId(pdfId) });
  console.log(`[Embedding] Deleted embeddings for PDF ${pdfId}`);
}

// Vector search is done via native MongoDB aggregation above.
// No LangChain vector store wrapper needed — avoids mongodb version conflicts.

