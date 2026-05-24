import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Workspace } from "@/lib/models";
import { deleteCache, CacheKeys } from "@/lib/redis";

// GET /api/workspaces
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const workspaces = await Workspace.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, data: workspaces });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/workspaces
const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  color: z.enum(["indigo", "violet", "teal", "rose", "amber", "sky"]).default("indigo"),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = CreateWorkspaceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
    }

    await connectToDatabase();

    // Check workspace limit (free = 1, pro = 10)
    const count = await Workspace.countDocuments({ userId });
    if (count >= 10) {
      return NextResponse.json(
        { error: "Workspace limit reached. Upgrade to Pro for more workspaces." },
        { status: 403 }
      );
    }

    const workspace = await Workspace.create({
      userId,
      ...parsed.data,
      settings: {
        defaultModel: "gpt-4o",
        maxTokens: 2048,
        temperature: 0.7,
      },
    });

    await deleteCache(CacheKeys.workspaceList(userId));

    return NextResponse.json({ success: true, data: workspace }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
