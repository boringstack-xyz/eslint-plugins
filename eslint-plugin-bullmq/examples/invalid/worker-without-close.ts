// ❌  class owns a worker but has no close / shutdown / dispose / onModuleDestroy method
import { Worker } from "bullmq";

export class JobService {
  private worker = new Worker("queue", async () => {
    return { ok: true };
  });
}
