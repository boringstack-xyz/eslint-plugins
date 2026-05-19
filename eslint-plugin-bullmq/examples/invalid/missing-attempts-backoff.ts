// ❌  attempts: 5 with no backoff — retries fire back-to-back, likely failing identically
import { Queue } from "bullmq";

const SEND_EMAIL = "send-email" as const;

const emailQueue = new Queue("email");

export async function enqueue(): Promise<void> {
  await emailQueue.add(SEND_EMAIL, { to: "x" }, {
    removeOnComplete: true,
    removeOnFail: 1000,
    attempts: 5
    // missing backoff
  });
}
