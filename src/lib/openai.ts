import OpenAI from "openai";
import { RAG_CONFIG } from "@/constants";

// Singleton OpenAI client
let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 3,
      timeout: 60000, // 60s
    });
  }
  return openaiClient;
}

// =============================================================================
// EMBEDDING GENERATION
// =============================================================================

export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient();
  const response = await client.embeddings.create({
    model: RAG_CONFIG.embeddingModel,
    input: text.replace(/\n/g, " "),
    dimensions: RAG_CONFIG.embeddingDimensions,
  });
  return response.data[0].embedding;
}

export async function generateEmbeddingsBatch(
  texts: string[]
): Promise<number[][]> {
  const client = getOpenAIClient();

  // Process in batches of 100
  const batches: string[][] = [];
  for (let i = 0; i < texts.length; i += RAG_CONFIG.batchSize) {
    batches.push(texts.slice(i, i + RAG_CONFIG.batchSize));
  }

  const allEmbeddings: number[][] = [];

  for (const batch of batches) {
    const response = await client.embeddings.create({
      model: RAG_CONFIG.embeddingModel,
      input: batch.map((t) => t.replace(/\n/g, " ")),
      dimensions: RAG_CONFIG.embeddingDimensions,
    });
    allEmbeddings.push(...response.data.map((d) => d.embedding));
  }

  return allEmbeddings;
}

export default getOpenAIClient;
