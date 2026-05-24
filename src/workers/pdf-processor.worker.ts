import { Worker, Job } from "bullmq";
import { connectToDatabase } from "@/lib/mongodb";
import { PDFModel } from "@/lib/models";
import { extractTextFromPDF, chunkText, fetchPDFBuffer } from "@/services/pdf.service";
import { storeEmbeddings } from "@/services/embedding.service";
import { redisConnection, QUEUE_NAMES } from "@/queues/pdf-processing.queue";
import type { PDFProcessingJob, PDFProcessingResult } from "@/types";

// =============================================================================
// PDF PROCESSING WORKER
// =============================================================================

export function createPDFWorker(): Worker<PDFProcessingJob, PDFProcessingResult> {
  const worker = new Worker<PDFProcessingJob, PDFProcessingResult>(
    QUEUE_NAMES.pdfProcessing,
    async (job: Job<PDFProcessingJob>) => {
      const startTime = Date.now();
      const { pdfId, userId, workspaceId, fileUrl, fileKey, fileName } = job.data;

      console.log(`[Worker] Processing PDF: ${pdfId} (${fileName})`);

      await connectToDatabase();

      try {
        // 1. Update status to processing
        await PDFModel.findByIdAndUpdate(pdfId, { status: "processing" });
        await job.updateProgress(10);

        // 2. Fetch PDF from storage
        const buffer = await fetchPDFBuffer(fileUrl);
        await job.updateProgress(25);

        // 3. Extract text
        const { text, pages, metadata } = await extractTextFromPDF(buffer, fileName);
        await job.updateProgress(50);

        if (!text || text.trim().length < 10) {
          throw new Error("PDF appears to be empty or could not be parsed (possibly scanned without OCR)");
        }

        // 4. Chunk text
        const chunks = await chunkText(text, fileKey, fileName);
        await job.updateProgress(65);

        console.log(`[Worker] Generated ${chunks.length} chunks from ${pages} pages`);

        // 5. Generate and store embeddings
        await storeEmbeddings(chunks, pdfId, workspaceId, userId);
        await job.updateProgress(90);

        // 6. Update PDF record as ready
        await PDFModel.findByIdAndUpdate(pdfId, {
          status: "ready",
          pages,
          metadata,
          chunkCount: chunks.length,
          processedAt: new Date(),
        });

        await job.updateProgress(100);

        const processingTimeMs = Date.now() - startTime;
        console.log(`[Worker] PDF ${pdfId} processed in ${processingTimeMs}ms`);

        return {
          pdfId,
          chunkCount: chunks.length,
          pages,
          processingTimeMs,
        };
      } catch (error) {
        const errorMessage = (error as Error).message;
        console.error(`[Worker] Failed to process PDF ${pdfId}:`, errorMessage);

        // Update PDF status to failed
        await PDFModel.findByIdAndUpdate(pdfId, {
          status: "failed",
          errorMessage,
        });

        throw error; // Re-throw for BullMQ retry logic
      }
    },
    {
      connection: redisConnection,
      concurrency: 5, // Process 5 PDFs simultaneously
      limiter: {
        max: 10, // Max 10 jobs per 1000ms
        duration: 1000,
      },
    }
  );

  worker.on("completed", (job, result) => {
    console.log(`[Worker] Job ${job.id} completed:`, result);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  worker.on("error", (err) => {
    console.error("[Worker] Worker error:", err);
  });

  return worker;
}
