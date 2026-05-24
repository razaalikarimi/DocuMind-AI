import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { PDFModel, Workspace } from "@/lib/models";
import { deleteEmbeddingsForPDF } from "@/services/embedding.service";
import { deleteCache, CacheKeys } from "@/lib/redis";
import mongoose from "mongoose";

// GET /api/pdfs/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectToDatabase();

    const pdf = await PDFModel.findOne({ _id: id, userId }).lean();
    if (!pdf) return NextResponse.json({ error: "PDF not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: pdf });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/pdfs/[id] — Rename PDF
const UpdatePDFSchema = z.object({
  name: z.string().min(1).max(255),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const parsed = UpdatePDFSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    await connectToDatabase();

    const pdf = await PDFModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: { name: parsed.data.name } },
      { new: true }
    ).lean();

    if (!pdf) return NextResponse.json({ error: "PDF not found" }, { status: 404 });

    await deleteCache(CacheKeys.pdfMetadata(id));

    return NextResponse.json({ success: true, data: pdf });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/pdfs/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectToDatabase();

    const pdf = await PDFModel.findOneAndDelete({ _id: id, userId });
    if (!pdf) return NextResponse.json({ error: "PDF not found" }, { status: 404 });

    // Remove from workspace
    await Workspace.findByIdAndUpdate(pdf.workspaceId, {
      $pull: { pdfIds: pdf._id },
    });

    // Delete all embeddings for this PDF (async, non-blocking)
    deleteEmbeddingsForPDF(id).catch((err) =>
      console.error("[PDFs API] Failed to delete embeddings:", err)
    );

    await deleteCache(CacheKeys.pdfMetadata(id));
    await deleteCache(CacheKeys.pdfList(userId, pdf.workspaceId.toString()));

    return NextResponse.json({ success: true, message: "PDF deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
