// ❌  worker is registered but has no failed listener — failures are silent
import { Worker } from "bullmq";

const worker = new Worker("queue", async () => {});

worker.on("completed", () => {
  // logger.info ...
});

// missing: worker.on("failed", ...)

async function shutdown(): Promise<void> {
  await worker.close();
}

process.on("SIGTERM", shutdown);
