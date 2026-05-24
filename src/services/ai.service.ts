import { getOpenAIClient } from "@/lib/openai";
import { hybridSearch, type SimilarChunk } from "./embedding.service";
import { RAG_CONFIG } from "@/constants";
import type { Message } from "@/types";

export interface ChatContext {
  query: string;
  workspaceId: string;
  pdfIds: string[];
  chatHistory: Pick<Message, "role" | "content">[];
}

export interface RAGResult {
  sources: SimilarChunk[];
  context: string;
}

// =============================================================================
// SYSTEM PROMPT
// =============================================================================

const SYSTEM_PROMPT = `You are DocuMind AI, an expert document analysis assistant. You help users understand and extract insights from their PDF documents.

## Your Behavior:
- Answer questions based ONLY on the provided document context
- Be precise, accurate, and cite specific information from the documents
- If information is not in the documents, clearly say so — do not hallucinate
- Format responses with proper markdown: use headers, bullet points, code blocks where appropriate
- When referencing information, naturally mention which document/page it came from
- Be concise but comprehensive — avoid padding or filler text

## Response Format:
- Use markdown formatting
- Bold key terms and important data points
- Use bullet points for lists
- Include source references naturally in your response`;

// =============================================================================
// MULTI-QUERY EXPANSION
// =============================================================================

async function expandQuery(query: string): Promise<string[]> {
  const client = getOpenAIClient();
  
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Generate 3 alternative phrasings of the following question that could retrieve relevant information from a document. Return ONLY a JSON array of strings, no explanation.",
      },
      { role: "user", content: query },
    ],
    temperature: 0.7,
    max_tokens: 200,
    response_format: { type: "json_object" },
  });

  try {
    const parsed = JSON.parse(
      response.choices[0].message.content ?? '{"queries":[]}'
    );
    const queries: string[] = parsed.queries ?? [];
    return [query, ...queries].slice(0, 4);
  } catch {
    return [query];
  }
}

// =============================================================================
// CONTEXT ASSEMBLY
// =============================================================================

function assembleContext(
  chunks: SimilarChunk[],
  maxTokens: number = RAG_CONFIG.maxContextTokens
): string {
  let context = "";
  let estimatedTokens = 0;

  for (const chunk of chunks) {
    const chunkText = `[Source: ${chunk.metadata.pdfName}, Page ${chunk.metadata.page}]\n${chunk.content}\n\n`;
    const chunkTokens = Math.ceil(chunkText.length / 4); // Rough token estimate

    if (estimatedTokens + chunkTokens > maxTokens) break;

    context += chunkText;
    estimatedTokens += chunkTokens;
  }

  return context.trim();
}

// =============================================================================
// RETRIEVE CONTEXT (RAG)
// =============================================================================

export async function retrieveContext(
  ctx: ChatContext
): Promise<RAGResult> {
  const { query, workspaceId, pdfIds, chatHistory } = ctx;

  // Multi-query expansion for better recall
  let queries = [query];
  if (pdfIds.length > 0) {
    try {
      queries = await expandQuery(query);
    } catch {
      // Fall back to original query
    }
  }

  // Run searches in parallel for all query variants
  const searchPromises = queries.map((q) =>
    hybridSearch(q, workspaceId, pdfIds.length > 0 ? pdfIds : undefined)
  );
  const allResults = await Promise.all(searchPromises);

  // Merge and deduplicate results
  const seen = new Set<string>();
  const mergedChunks: SimilarChunk[] = [];

  for (const results of allResults) {
    for (const chunk of results) {
      const key = chunk.content.substring(0, 100);
      if (!seen.has(key)) {
        seen.add(key);
        mergedChunks.push(chunk);
      }
    }
  }

  // Sort by score
  mergedChunks.sort((a, b) => b.score - a.score);

  const topChunks = mergedChunks.slice(0, RAG_CONFIG.topK);
  const context = assembleContext(topChunks);

  return { sources: topChunks, context };
}

// =============================================================================
// BUILD CHAT MESSAGES FOR LLM
// =============================================================================

export function buildMessages(
  query: string,
  context: string,
  chatHistory: Pick<Message, "role" | "content">[]
): { role: "system" | "user" | "assistant"; content: string }[] {
  const messages: { role: "system" | "user" | "assistant"; content: string }[] =
    [{ role: "system", content: SYSTEM_PROMPT }];

  // Add conversation history (last N turns)
  const historyTurns = chatHistory.slice(
    -RAG_CONFIG.conversationMemoryTurns * 2
  );
  for (const msg of historyTurns) {
    if (msg.role === "user" || msg.role === "assistant") {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  // Add current query with context
  const userMessage =
    context.length > 0
      ? `## Document Context:\n\n${context}\n\n---\n\n## Question:\n${query}`
      : query;

  messages.push({ role: "user", content: userMessage });

  return messages;
}

// =============================================================================
// GENERATE TITLE FOR CHAT
// =============================================================================

export async function generateChatTitle(firstMessage: string): Promise<string> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Generate a short, descriptive title (max 6 words) for a chat that starts with this message. Return ONLY the title, no quotes.",
      },
      { role: "user", content: firstMessage },
    ],
    temperature: 0.5,
    max_tokens: 20,
  });

  return (
    response.choices[0].message.content?.trim() ??
    firstMessage.substring(0, 40)
  );
}
