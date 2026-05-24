import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { connectToDatabase } from "@/lib/mongodb";
import { PDFModel, Workspace } from "@/lib/models";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default async function NewChatPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  await connectToDatabase();

  // Get default workspace
  const workspace = await Workspace.findOne({ userId }).lean();
  if (!workspace) redirect("/sign-in");

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

  const workspaceId = workspace._id.toString();

  return (
    <div className="chat-page">
      <ChatInterface
        workspaceId={workspaceId}
        availablePDFs={serializedPDFs as never}
      />
      <style>{`
        .chat-page {
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
