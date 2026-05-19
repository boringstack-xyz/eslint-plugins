// Standalone worker process — the one binary your ops team runs as a long-lived service.
import { Worker } from "bullmq";

const worker = new Worker(
  "email",
  async (job) => {
    // process job ...
    return { id: job.id, ok: true };
  },
  { concurrency: 8 }
);

worker.on("failed", (job, err) => {
  console.error("Worker job failed", { id: job?.id, err });
});

worker.on("error", (err) => {
  console.error("Worker error", err);
});

async function shutdown(): Promise<void> {
  await worker.close();
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
