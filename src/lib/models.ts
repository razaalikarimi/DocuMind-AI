import mongoose, { Schema, Document, Model } from "mongoose";
import { COLLECTIONS } from "@/constants";

// =============================================================================
// USER MODEL
// =============================================================================

export interface IUser extends Document {
  clerkId: string;
  email: string;
  name: string;
  avatar?: string;
  plan: "free" | "pro" | "enterprise";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    avatar: { type: String },
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
  },
  { timestamps: true, collection: COLLECTIONS.users }
);

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

// =============================================================================
// WORKSPACE MODEL
// =============================================================================

export interface IWorkspace extends Document {
  userId: string;
  name: string;
  description?: string;
  color: string;
  pdfIds: mongoose.Types.ObjectId[];
  chatIds: mongoose.Types.ObjectId[];
  settings: {
    defaultModel: string;
    systemPrompt?: string;
    maxTokens: number;
    temperature: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    color: { type: String, default: "indigo" },
    pdfIds: [{ type: Schema.Types.ObjectId, ref: "PDF" }],
    chatIds: [{ type: Schema.Types.ObjectId, ref: "Chat" }],
    settings: {
      defaultModel: { type: String, default: "gpt-4o" },
      systemPrompt: { type: String },
      maxTokens: { type: Number, default: 2048 },
      temperature: { type: Number, default: 0.7 },
    },
  },
  { timestamps: true, collection: COLLECTIONS.workspaces }
);

WorkspaceSchema.index({ userId: 1, createdAt: -1 });

export const Workspace: Model<IWorkspace> =
  mongoose.models.Workspace ??
  mongoose.model<IWorkspace>("Workspace", WorkspaceSchema);

// =============================================================================
// PDF MODEL
// =============================================================================

export interface IPDF extends Document {
  workspaceId: mongoose.Types.ObjectId;
  userId: string;
  name: string;
  originalName: string;
  fileUrl: string;
  fileKey: string;
  size: number;
  pages: number;
  status: "uploading" | "queued" | "processing" | "ready" | "failed";
  errorMessage?: string;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
    language?: string;
  };
  chunkCount?: number;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PDFSchema = new Schema<IPDF>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    originalName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileKey: { type: String, required: true, unique: true },
    size: { type: Number, required: true },
    pages: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["uploading", "queued", "processing", "ready", "failed"],
      default: "uploading",
    },
    errorMessage: { type: String },
    metadata: {
      title: String,
      author: String,
      subject: String,
      keywords: String,
      creator: String,
      producer: String,
      language: String,
    },
    chunkCount: { type: Number },
    processedAt: { type: Date },
  },
  { timestamps: true, collection: COLLECTIONS.pdfs }
);

PDFSchema.index({ workspaceId: 1, status: 1 });
PDFSchema.index({ userId: 1, createdAt: -1 });

export const PDFModel: Model<IPDF> =
  mongoose.models.PDF ?? mongoose.model<IPDF>("PDF", PDFSchema);

// =============================================================================
// CHAT MODEL
// =============================================================================

export interface IChat extends Document {
  workspaceId: mongoose.Types.ObjectId;
  userId: string;
  pdfIds: mongoose.Types.ObjectId[];
  title: string;
  pinned: boolean;
  messageCount: number;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    userId: { type: String, required: true, index: true },
    pdfIds: [{ type: Schema.Types.ObjectId, ref: "PDF" }],
    title: { type: String, default: "New Chat" },
    pinned: { type: Boolean, default: false },
    messageCount: { type: Number, default: 0 },
    lastMessageAt: { type: Date },
  },
  { timestamps: true, collection: COLLECTIONS.chats }
);

ChatSchema.index({ userId: 1, updatedAt: -1 });
ChatSchema.index({ userId: 1, pinned: -1, updatedAt: -1 });
ChatSchema.index({ workspaceId: 1 });

export const Chat: Model<IChat> =
  mongoose.models.Chat ?? mongoose.model<IChat>("Chat", ChatSchema);

// =============================================================================
// MESSAGE MODEL
// =============================================================================

export interface IMessage extends Document {
  chatId: mongoose.Types.ObjectId;
  role: "user" | "assistant" | "system";
  content: string;
  sources: {
    pdfId: mongoose.Types.ObjectId;
    pdfName: string;
    pageNumber: number;
    chunk: string;
    score: number;
  }[];
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    chatId: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
    sources: [
      {
        pdfId: { type: Schema.Types.ObjectId, ref: "PDF" },
        pdfName: String,
        pageNumber: Number,
        chunk: String,
        score: Number,
      },
    ],
    tokenUsage: {
      promptTokens: Number,
      completionTokens: Number,
      totalTokens: Number,
    },
  },
  { timestamps: true, collection: COLLECTIONS.messages }
);

MessageSchema.index({ chatId: 1, createdAt: 1 });

export const Message: Model<IMessage> =
  mongoose.models.Message ?? mongoose.model<IMessage>("Message", MessageSchema);

// =============================================================================
// EMBEDDING MODEL
// =============================================================================

export interface IEmbedding extends Document {
  pdfId: mongoose.Types.ObjectId;
  workspaceId: mongoose.Types.ObjectId;
  userId: string;
  content: string;
  embedding: number[];
  metadata: {
    page: number;
    chunk: number;
    source: string;
    pdfName: string;
    totalChunks: number;
  };
  createdAt: Date;
}

const EmbeddingSchema = new Schema<IEmbedding>(
  {
    pdfId: { type: Schema.Types.ObjectId, ref: "PDF", required: true, index: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    userId: { type: String, required: true },
    content: { type: String, required: true },
    embedding: { type: [Number], required: true },
    metadata: {
      page: { type: Number, required: true },
      chunk: { type: Number, required: true },
      source: { type: String, required: true },
      pdfName: { type: String, required: true },
      totalChunks: { type: Number, required: true },
    },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: COLLECTIONS.embeddings }
);

EmbeddingSchema.index({ pdfId: 1 });
EmbeddingSchema.index({ workspaceId: 1 });

export const Embedding: Model<IEmbedding> =
  mongoose.models.Embedding ??
  mongoose.model<IEmbedding>("Embedding", EmbeddingSchema);

// =============================================================================
// AUDIT LOG MODEL
// =============================================================================

export interface IAuditLog extends Document {
  userId: string;
  action: string;
  resource: string;
  resourceId?: mongoose.Types.ObjectId;
  metadata: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: String, required: true },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    resourceId: { type: Schema.Types.ObjectId },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ip: { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: COLLECTIONS.auditLogs,
  }
);

AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ??
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
