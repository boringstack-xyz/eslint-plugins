// ❌  concurrency: 0 — worker boots fine, listens for events, processes nothing
import { Worker } from "bullmq";

const worker = new Worker(
  "email",
  async (job) => job.data,
  { concurrency: 0 }
);

worker.on("failed", () => {});
