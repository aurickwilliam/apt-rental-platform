export interface VerificationRow {
  id: string;
  label: string;
  detail: string;
  submittedAt: string;
  image: string | null;
}

export const submittedFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "Asia/Manila",
});

export const VERIFICATION_QUEUES = ["users", "apartments", "documents"] as const;
export type VerificationQueue = (typeof VERIFICATION_QUEUES)[number];

export type VerificationQueueData = Record<
  VerificationQueue,
  { rows: VerificationRow[]; count: number }
>;

export function parseVerificationQueue(
  value: string | null | undefined,
): VerificationQueue {
  return (VERIFICATION_QUEUES as readonly string[]).includes(value ?? "")
    ? (value as VerificationQueue)
    : "users";
}
