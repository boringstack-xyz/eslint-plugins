import { Queue } from "bullmq";

const JOB_NAMES = {
  SendEmail: "send-email",
  DeleteUser: "delete-user"
} as const;

export const emailQueue = new Queue("email", {
  defaultJobOptions: {
    removeOnComplete: 1000,
    removeOnFail: 5000,
    attempts: 5,
    backoff: { type: "exponential", delay: 1000 }
  }
});

export async function enqueueWelcome(userId: string): Promise<void> {
  await emailQueue.add(JOB_NAMES.SendEmail, { kind: "welcome", userId });
}

export async function enqueueDeletion(userId: string): Promise<void> {
  await emailQueue.add(JOB_NAMES.DeleteUser, { userId });
}
