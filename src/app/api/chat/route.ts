import { auth } from "@clerk/nextjs/server";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Chat, Message } from "@/lib/models";
import { retrieveContext, buildMessages, generateChatTitle } from "@/services/ai.service";
import { chatRateLimiter, checkRateLimit } from "@/lib/rate-limit";
import mongoose from "mongoose";

const ChatRequestSchema = z.object({
  chatId: z.string().optional(),
  workspaceId: z.string(),
  pdfIds: z.array(z.string()).default([]),
  message: z.string().min(1).max(4000),
});

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Rate limit
    const { success, remaining } = await checkRateLimit(chatRateLimiter, userId);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } }
      );
    }

    // 3. Parse & validate body
    const body = await req.json();
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { chatId, workspaceId, pdfIds, message } = parsed.data;

    await connectToDatabase();

    // 4. Get or create chat
    let chat;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, userId });
      if (!chat) {
        return NextResponse.json({ error: "Chat not found" }, { status: 404 });
      }
    } else {
      chat = await Chat.create({
        workspaceId: new mongoose.Types.ObjectId(workspaceId),
        userId,
        pdfIds: pdfIds.map((id) => new mongoose.Types.ObjectId(id)),
        title: "New Chat",
      });
    }

    // 5. Get conversation history (last 12 messages)
    const history = await Message.find({ chatId: chat._id })
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();
    const chatHistory = history.reverse();

    // 6. Save user message
    const userMessage = await Message.create({
      chatId: chat._id,
      role: "user",
      content: message,
      sources: [],
    });

    // 7. Retrieve RAG context
    const { sources, context } = await retrieveContext({
      query: message,
      workspaceId,
      pdfIds,
      chatHistory,
    });

    // 8. Build messages for LLM
    const llmMessages = buildMessages(message, context, chatHistory);

    // 9. Stream AI response
    let fullContent = "";
    const savedMessageId = new mongoose.Types.ObjectId().toString();

    const result = streamText({
      model: openai(process.env.OPENAI_CHAT_MODEL ?? "gpt-4o"),
      messages: llmMessages,
      temperature: 0.7,
      maxOutputTokens: 2048,
      onFinish: async ({ text, usage }) => {
        fullContent = text;

        // Save assistant message
        await Message.create({
          _id: new mongoose.Types.ObjectId(savedMessageId),
          chatId: chat._id,
          role: "assistant",
          content: text,
          sources: sources.map((s) => ({
            pdfId: new mongoose.Types.ObjectId(s.metadata.pdfId),
            pdfName: s.metadata.pdfName,
            pageNumber: s.metadata.page,
            chunk: s.content.substring(0, 200),
            score: s.score,
          })),
          tokenUsage: {
            promptTokens: (usage as unknown as Record<string, number>).promptTokens ?? 0,
            completionTokens: (usage as unknown as Record<string, number>).completionTokens ?? 0,
            totalTokens: (usage as unknown as Record<string, number>).totalTokens ?? 0,
          },
        });

        // Update chat metadata
        await Chat.findByIdAndUpdate(chat._id, {
          $inc: { messageCount: 2 },
          lastMessageAt: new Date(),
        });

        // Auto-generate title after first message
        if (chat.messageCount === 0) {
          const title = await generateChatTitle(message);
          await Chat.findByIdAndUpdate(chat._id, { title });
        }
      },
    });

    // Return streaming response with chat ID header
    return result.toTextStreamResponse({
      headers: {
        "X-Chat-Id": chat._id.toString(),
        "X-Message-Id": savedMessageId,
        "X-Sources": JSON.stringify(
          sources.slice(0, 5).map((s) => ({
            pdfName: s.metadata.pdfName,
            page: s.metadata.page,
            score: s.score,
          }))
        ),
      },
    });
  } catch (error) {
    console.error("[Chat API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
