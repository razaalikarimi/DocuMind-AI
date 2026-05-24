import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { PDFModel, Workspace, Chat } from "@/lib/models";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { chatId } = await params;
  await connectToDatabase();

  // Get chat
  const chat = await Chat.findOne({ _id: chatId, userId }).lean();
  if (!chat) notFound();

  // Get workspace
  const workspace = await Workspace.findById(chat.workspaceId).lean();
  if (!workspace) notFound();

  // Get available PDFs
  const pdfs = await PDFModel.find({
    userId,
    workspaceId: workspace._id,
    status: "ready",
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const serializedPDFs = pdfs.map((p) => ({
    ...p,
    _id: p._id.toString(),
    workspaceId: p.workspaceId.toString(),
    userId: p.userId.toString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const serializedChat = {
    ...chat,
    _id: chat._id.toString(),
    workspaceId: chat.workspaceId.toString(),
    userId: chat.userId.toString(),
    createdAt: chat.createdAt.toISOString(),
    updatedAt: chat.updatedAt.toISOString(),
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <ChatInterface
        chatId={chatId}
        initialChat={serializedChat as never}
        workspaceId={workspace._id.toString()}
        availablePDFs={serializedPDFs as never}
      />
    </div>
  );
}
