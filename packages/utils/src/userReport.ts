/** Report reasons accepted by the `report_user` RPC (keep in sync with the DB check). Shared by web and mobile. */
export const USER_REPORT_REASONS = [
  { value: 'spam', label: 'Spam', description: 'Unwanted or repeated messages' },
  { value: 'scam', label: 'Scam or fraud', description: 'Asking for money, deposits or details outside APT' },
  { value: 'harassment', label: 'Harassment', description: 'Threats, insults or bullying' },
  { value: 'inappropriate', label: 'Inappropriate content', description: 'Offensive photos or messages' },
  { value: 'fake_profile', label: 'Fake profile or listing', description: "Pretending to be someone else, or a listing that isn't real" },
  { value: 'other', label: 'Something else', description: 'Tell us what happened' },
] as const;

export type UserReportReason = (typeof USER_REPORT_REASONS)[number]['value'];

export const USER_REPORT_DETAILS_MAX_LENGTH = 1000;
