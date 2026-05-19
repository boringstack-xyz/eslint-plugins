// NestJS-style provider using onModuleDestroy as the close hook
import { Worker } from "bullmq";

interface OnModuleDestroy {
  onModuleDestroy(): Promise<void>;
}

export class EmailWorker implements OnModuleDestroy {
  private worker = new Worker(
    "email",
    async (job) => job.data,
    { concurrency: 10 }
  );

  constructor() {
    this.worker.on("failed", (job, err) => {
      // logger.error({ jobId: job?.id, err }, "email worker failed");
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker.close();
  }
}
