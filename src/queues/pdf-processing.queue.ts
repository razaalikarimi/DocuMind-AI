import { Queue } from "bullmq";
import { QUEUE_NAMES } from "@/constants";
import type { PDFProcessingJob } from "@/types";

export { QUEUE_NAMES };

const redisConnection = {
  host: process.env.REDIS_URL
    ? new URL(process.env.REDIS_URL).hostname
    : "localhost",
  port: process.env.REDIS_URL
    ? parseInt(new URL(process.env.REDIS_URL).port)
    : 6379,
  password: process.env.REDIS_URL
    ? new URL(process.env.REDIS_URL).password
    : undefined,
  tls: process.env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
};

// =============================================================================
// PDF PROCESSING QUEUE
// =============================================================================

let pdfQueue: Queue<PDFProcessingJob> | null = null;

export function getPDFQueue(): Queue<PDFProcessingJob> {
  if (!pdfQueue) {
    pdfQueue = new Queue<PDFProcessingJob>(QUEUE_NAMES.pdfProcessing, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000, // 5s, 10s, 20s
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      },
    });
  }
  return pdfQueue;
}

// =============================================================================
// ADD JOB TO QUEUE
// =============================================================================

export async function queuePDFProcessing(
  job: PDFProcessingJob
): Promise<string> {
  const queue = getPDFQueue();
  const addedJob = await queue.add("process-pdf", job, {
    jobId: `pdf-${job.pdfId}`, // Deduplicate by PDF ID
    priority: 1,
  });
  
  console.log(`[Queue] Queued PDF processing job: ${addedJob.id}`);
  return addedJob.id ?? "";
}

// =============================================================================
// GET JOB STATUS
// =============================================================================

export async function getJobStatus(jobId: string): Promise<{
  status: string;
  progress: number;
  failedReason?: string;
} | null> {
  const queue = getPDFQueue();
  const job = await queue.getJob(jobId);

  if (!job) return null;

  const state = await job.getState();

  return {
    status: state,
    progress:
      typeof job.progress === "number" ? job.progress : 0,
    failedReason: job.failedReason,
  };
}

// =============================================================================
// QUEUE METRICS
// =============================================================================

export async function getQueueMetrics() {
  const queue = getPDFQueue();
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

export { redisConnection };
