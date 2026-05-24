// =============================================================================
// CORE TYPE DEFINITIONS
// =============================================================================

export type ID = string;

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

// =============================================================================
// USER TYPES
// =============================================================================

export type UserPlan = "free" | "pro" | "enterprise";

export interface User extends Timestamps {
  _id: ID;
  clerkId: string;
  email: string;
  name: string;
  avatar?: string;
  plan: UserPlan;
}

// =============================================================================
// WORKSPACE TYPES
// =============================================================================

export type WorkspaceColor =
  | "indigo"
  | "violet"
  | "teal"
  | "rose"
  | "amber"
  | "sky";

export interface Workspace extends Timestamps {
  _id: ID;
  userId: ID;
  name: string;
  description?: string;
  color: WorkspaceColor;
  pdfIds: ID[];
  chatIds: ID[];
  settings: WorkspaceSettings;
}

export interface WorkspaceSettings {
  defaultModel: string;
  systemPrompt?: string;
  maxTokens: number;
  temperature: number;
}

// =============================================================================
// PDF TYPES
// =============================================================================

export type PDFStatus =
  | "uploading"
  | "queued"
  | "processing"
  | "ready"
  | "failed";

export interface PDF extends Timestamps {
  _id: ID;
  workspaceId: ID;
  userId: ID;
  name: string;
  originalName: string;
  fileUrl: string;
  fileKey: string;
  size: number;
  pages: number;
  status: PDFStatus;
  errorMessage?: string;
  metadata: PDFMetadata;
  chunkCount?: number;
  processedAt?: Date;
}

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  language?: string;
}

// =============================================================================
// CHAT TYPES
// =============================================================================

export interface Chat extends Timestamps {
  _id: ID;
  workspaceId: ID;
  userId: ID;
  pdfIds: ID[];
  title: string;
  pinned: boolean;
  messageCount: number;
  lastMessageAt?: Date;
}

export type MessageRole = "user" | "assistant" | "system";

export interface Message extends Timestamps {
  _id: ID;
  chatId: ID;
  role: MessageRole;
  content: string;
  sources: MessageSource[];
  tokenUsage?: TokenUsage;
  isStreaming?: boolean;
}

export interface MessageSource {
  pdfId: ID;
  pdfName: string;
  pageNumber: number;
  chunk: string;
  score: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// =============================================================================
// EMBEDDING TYPES
// =============================================================================

export interface Embedding {
  _id: ID;
  pdfId: ID;
  workspaceId: ID;
  userId: ID;
  content: string;
  embedding: number[];
  metadata: EmbeddingMetadata;
  createdAt: Date;
}

export interface EmbeddingMetadata {
  page: number;
  chunk: number;
  source: string;
  pdfName: string;
  totalChunks: number;
}

// =============================================================================
// SUBSCRIPTION TYPES
// =============================================================================

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing";

export interface Subscription extends Timestamps {
  _id: ID;
  userId: ID;
  plan: UserPlan;
  status: SubscriptionStatus;
  periodStart: Date;
  periodEnd: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

// =============================================================================
// API TYPES
// =============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

// =============================================================================
// QUEUE TYPES
// =============================================================================

export interface PDFProcessingJob {
  pdfId: ID;
  userId: ID;
  workspaceId: ID;
  fileUrl: string;
  fileKey: string;
  fileName: string;
}

export interface PDFProcessingResult {
  pdfId: ID;
  chunkCount: number;
  pages: number;
  processingTimeMs: number;
}

// =============================================================================
// ANALYTICS TYPES
// =============================================================================

export interface AuditLog extends Timestamps {
  _id: ID;
  userId: ID;
  action: string;
  resource: string;
  resourceId?: ID;
  metadata: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}
