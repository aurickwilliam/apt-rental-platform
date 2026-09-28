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
