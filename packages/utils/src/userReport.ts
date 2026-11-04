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

/** Reasons accepted by the `report_apartment` RPC (keep in sync with the DB). */
export const APARTMENT_REPORT_REASONS = [
  { value: 'fake_listing', label: 'Fake or misleading listing', description: "The place isn't real or isn't what's shown" },
  { value: 'incorrect_info', label: 'Wrong price or details', description: 'Rent, location or amenities are not accurate' },
  { value: 'unavailable', label: 'Already rented', description: 'The unit is no longer available' },
  { value: 'scam', label: 'Scam or fraud', description: 'Asking for money or deposits outside APT' },
  { value: 'inappropriate_photos', label: 'Inappropriate photos', description: 'Offensive or stolen photos' },
  { value: 'other', label: 'Something else', description: 'Tell us what happened' },
] as const;

export type ApartmentReportReason = (typeof APARTMENT_REPORT_REASONS)[number]['value'];

/** What a report is about: a chat contact, a listing, or a landlord/tenant profile. */
export type UserReportTargetType = 'user' | 'apartment' | 'landlord' | 'tenant' | 'review_request';

export const USER_REPORT_TARGET_LABELS: Record<UserReportTargetType, string> = {
  user: 'Chat',
  apartment: 'Apartment',
  landlord: 'Landlord',
  tenant: 'Tenant',
  review_request: 'Review request',
};
