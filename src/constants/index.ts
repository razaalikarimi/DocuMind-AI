// =============================================================================
// APPLICATION CONSTANTS
// =============================================================================

export const APP_NAME = "DocuMind AI";
export const APP_DESCRIPTION =
  "Chat with your PDFs using advanced AI. Extract insights, find answers, and understand documents instantly.";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// =============================================================================
// PLAN LIMITS
// =============================================================================

export const PLAN_LIMITS = {
  free: {
    pdfsPerWorkspace: 3,
    workspaces: 1,
    messagesPerDay: 50,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFileSizeLabel: "10MB",
  },
  pro: {
    pdfsPerWorkspace: 50,
    workspaces: 10,
    messagesPerDay: 1000,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxFileSizeLabel: "100MB",
  },
  enterprise: {
    pdfsPerWorkspace: Infinity,
    workspaces: Infinity,
    messagesPerDay: Infinity,
    maxFileSize: 500 * 1024 * 1024, // 500MB
    maxFileSizeLabel: "500MB",
  },
} as const;

// =============================================================================
// RATE LIMITS (requests per minute)
// =============================================================================

export const RATE_LIMITS = {
  api: 60,
  chat: 10,
  upload: 5,
  auth: 20,
} as const;

// =============================================================================
// RAG CONFIGURATION
// =============================================================================

export const RAG_CONFIG = {
  chunkSize: parseInt(process.env.RAG_CHUNK_SIZE ?? "1000"),
  chunkOverlap: parseInt(process.env.RAG_CHUNK_OVERLAP ?? "200"),
  topK: parseInt(process.env.RAG_TOP_K ?? "8"),
  similarityThreshold: parseFloat(
    process.env.RAG_SIMILARITY_THRESHOLD ?? "0.75"
  ),
  maxContextTokens: parseInt(process.env.RAG_MAX_CONTEXT_TOKENS ?? "3000"),
  conversationMemoryTurns: parseInt(
    process.env.RAG_CONVERSATION_MEMORY_TURNS ?? "6"
  ),
  embeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
  embeddingDimensions: parseInt(
    process.env.OPENAI_EMBEDDING_DIMENSIONS ?? "1536"
  ),
  chatModel: process.env.OPENAI_CHAT_MODEL ?? "gpt-4o",
  batchSize: 100,
} as const;

// =============================================================================
// CACHE TTL (seconds)
// =============================================================================

export const CACHE_TTL = {
  chatHistory: 300, // 5 minutes
  pdfMetadata: 600, // 10 minutes
  userProfile: 3600, // 1 hour
  workspaceList: 120, // 2 minutes
  pdfList: 120, // 2 minutes
} as const;

// =============================================================================
// QUEUE NAMES
// =============================================================================

export const QUEUE_NAMES = {
  pdfProcessing: "pdf-processing",
  embedding: "embedding",
  notification: "notification",
} as const;

// =============================================================================
// MONGODB COLLECTION NAMES
// =============================================================================

export const COLLECTIONS = {
  users: "users",
  workspaces: "workspaces",
  pdfs: "pdfs",
  embeddings: "embeddings",
  chats: "chats",
  messages: "messages",
  subscriptions: "subscriptions",
  auditLogs: "audit_logs",
} as const;

// =============================================================================
// VECTOR SEARCH
// =============================================================================

export const VECTOR_SEARCH = {
  indexName: "vector_index",
  collectionName: "embeddings",
  embeddingField: "embedding",
  textField: "content",
} as const;

// =============================================================================
// FILE UPLOAD
// =============================================================================

export const UPLOAD_CONFIG = {
  allowedTypes: ["application/pdf"],
  maxFileSizeFree: 10 * 1024 * 1024,
  maxFileSizePro: 100 * 1024 * 1024,
  maxFileSizeEnterprise: 500 * 1024 * 1024,
} as const;

// =============================================================================
// UI CONSTANTS
// =============================================================================

export const SIDEBAR_WIDTH = 280;
export const SIDEBAR_COLLAPSED_WIDTH = 0;
export const CHAT_MAX_WIDTH = 768;

export const WORKSPACE_COLORS = [
  { value: "indigo", label: "Indigo", hex: "#6366F1" },
  { value: "violet", label: "Violet", hex: "#8B5CF6" },
  { value: "teal", label: "Teal", hex: "#14B8A6" },
  { value: "rose", label: "Rose", hex: "#F43F5E" },
  { value: "amber", label: "Amber", hex: "#F59E0B" },
  { value: "sky", label: "Sky", hex: "#0EA5E9" },
] as const;
