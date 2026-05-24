import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { PDFModel, Workspace } from "@/lib/models";
import { queuePDFProcessing } from "@/queues/pdf-processing.queue";
import { deleteEmbeddingsForPDF } from "@/services/embedding.service";
import { deleteCache, CacheKeys } from "@/lib/redis";
import mongoose from "mongoose";

// GET /api/pdfs — List PDFs
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);

    await connectToDatabase();

    const filter: Record<string, unknown> = { userId };
    if (workspaceId) filter.workspaceId = new mongoose.Types.ObjectId(workspaceId);
    if (status) filter.status = status;

    const [pdfs, total] = await Promise.all([
      PDFModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      PDFModel.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: pdfs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/pdfs — Create PDF record and queue processing
const CreatePDFSchema = z.object({
  workspaceId: z.string(),
  name: z.string().min(1),
  originalName: z.string(),
  fileUrl: z.string().url(),
  fileKey: z.string(),
  size: z.number().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = CreatePDFSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }

    await connectToDatabase();

    // Verify workspace ownership
    const workspace = await Workspace.findOne({
      _id: parsed.data.workspaceId,
      userId,
    });
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Create PDF record
    const pdf = await PDFModel.create({
      workspaceId: new mongoose.Types.ObjectId(parsed.data.workspaceId),
      userId,
      name: parsed.data.name,
      originalName: parsed.data.originalName,
      fileUrl: parsed.data.fileUrl,
      fileKey: parsed.data.fileKey,
      size: parsed.data.size,
      status: "queued",
    });

    // Add PDF to workspace
    await Workspace.findByIdAndUpdate(parsed.data.workspaceId, {
      $push: { pdfIds: pdf._id },
    });

    // Queue background processing
    await queuePDFProcessing({
      pdfId: pdf._id.toString(),
      userId,
      workspaceId: parsed.data.workspaceId,
      fileUrl: parsed.data.fileUrl,
      fileKey: parsed.data.fileKey,
      fileName: parsed.data.originalName,
    });

    // Invalidate cache
    await deleteCache(CacheKeys.pdfList(userId, parsed.data.workspaceId));

    return NextResponse.json({ success: true, data: pdf }, { status: 201 });
  } catch (error) {
    console.error("[PDFs API] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
