// ❌  no removeOnFail — failed jobs accumulate in Redis forever
import { Queue } from "bullmq";

const SEND_EMAIL = "send-email" as const;

const emailQueue = new Queue("email");

export async function enqueue(): Promise<void> {
  await emailQueue.add(SEND_EMAIL, { to: "x" }, { removeOnComplete: true });
}
