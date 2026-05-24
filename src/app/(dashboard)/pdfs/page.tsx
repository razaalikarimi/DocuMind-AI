import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PDFsPageClient } from "@/components/pdf/PDFsPageClient";

export const metadata = {
  title: "Documents",
};

export default async function PDFsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return <PDFsPageClient userId={userId} />;
}
