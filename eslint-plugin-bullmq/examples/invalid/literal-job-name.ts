// ❌  inline string literal job names — drift between producer/worker/dashboards is now possible
import { Queue } from "bullmq";

const emailQueue = new Queue("email", {
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 1000,
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 }
  }
});

export async function enqueueWelcome(userId: string): Promise<void> {
  await emailQueue.add("send-email", { kind: "welcome", userId });
}
