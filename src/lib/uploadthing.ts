import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";
import { apiRateLimiter, checkRateLimit } from "@/lib/rate-limit";
import { UPLOAD_CONFIG } from "@/constants";

const f = createUploadthing();

export const ourFileRouter = {
  pdfUploader: f({ pdf: { maxFileSize: "128MB", maxFileCount: 10 } })
    .middleware(async ({ req }) => {
      // Auth check
      const { userId } = await auth();
      if (!userId) throw new Error("Unauthorized");

      // Rate limit uploads
      const { success } = await checkRateLimit(apiRateLimiter, `upload:${userId}`);
      if (!success) throw new Error("Too many uploads. Please wait.");

      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log(`[Upload] PDF uploaded by ${metadata.userId}: ${file.name}`);
      return {
        uploadedBy: metadata.userId,
        fileKey: file.key,
        fileUrl: file.ufsUrl,
        fileName: file.name,
        fileSize: file.size,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
