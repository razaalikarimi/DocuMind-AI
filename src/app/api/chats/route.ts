import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Chat, Message } from "@/lib/models";
import { deleteCache, CacheKeys } from "@/lib/redis";

// GET /api/chats — List user's chats
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "30"), 100);

    const filter: Record<string, unknown> = { userId };
    if (workspaceId) filter.workspaceId = workspaceId;
    if (search) filter.title = { $regex: search, $options: "i" };

    const [chats, total] = await Promise.all([
      Chat.find(filter)
        .sort({ pinned: -1, updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Chat.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: chats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error("[Chats API] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
