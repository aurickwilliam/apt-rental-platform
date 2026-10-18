// The four status chip tones, matching the keys of STATUS_COLORS in
// @repo/constants (DESIGN.md §16).
export type StatusTone = "success" | "warning" | "danger" | "neutral";

const SUCCESS_STATUSES = new Set([
  "verified",
  "approved",
  "resolved",
  "paid",
  "available",
  "visible",
]);
const WARNING_STATUSES = new Set([
  "pending",
  "applied",
  "in_progress",
  "rescheduled",
  "under_maintenance",
  "open",
]);
const DANGER_STATUSES = new Set([
  "rejected",
  "cancelled",
  "unpaid",
  "failed",
  "expired",
  "hidden",
  "suspended",
]);

// Tone for a raw status value ("In Progress", "in_progress", "PAID", …):
// success for verified/approved/paid/resolved, warning for pending/in
// progress, danger for rejected/cancelled/unpaid, neutral for anything else.
export function statusToneFor(status: string | null | undefined): StatusTone {
  const key = (status ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (SUCCESS_STATUSES.has(key)) return "success";
  if (WARNING_STATUSES.has(key)) return "warning";
  if (DANGER_STATUSES.has(key)) return "danger";
  return "neutral";
}
