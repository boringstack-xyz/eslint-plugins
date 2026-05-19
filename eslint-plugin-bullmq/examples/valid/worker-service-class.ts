import { Worker } from "bullmq";

export class JobService {
  private worker = new Worker(
    "email",
    async (job) => {
      // process job ...
      return { ok: true, id: job.id };
    },
    { concurrency: 5 }
  );

  constructor() {
    this.worker.on("failed", (job, err) => {
      console.error("Job failed", { id: job?.id, err });
    });
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
