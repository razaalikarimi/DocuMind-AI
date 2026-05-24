import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Chat, Message } from "@/lib/models";
import { deleteCache, CacheKeys } from "@/lib/redis";

// GET /api/chats/[id] — Get chat with messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectToDatabase();

    const chat = await Chat.findOne({ _id: id, userId }).lean();
    if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

    const messages = await Message.find({ chatId: id })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ success: true, data: { chat, messages } });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/chats/[id] — Update chat (rename, pin)
const UpdateChatSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  pinned: z.boolean().optional(),
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
    const parsed = UpdateChatSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    await connectToDatabase();

    const chat = await Chat.findOneAndUpdate(
      { _id: id, userId },
      { $set: parsed.data },
      { new: true }
    ).lean();

    if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

    await deleteCache(CacheKeys.chatList(userId));

    return NextResponse.json({ success: true, data: chat });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/chats/[id] — Delete chat and messages
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectToDatabase();

    const chat = await Chat.findOneAndDelete({ _id: id, userId });
    if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

    // Delete all messages for this chat
    await Message.deleteMany({ chatId: id });
    await deleteCache(CacheKeys.chatList(userId));

    return NextResponse.json({ success: true, message: "Chat deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
