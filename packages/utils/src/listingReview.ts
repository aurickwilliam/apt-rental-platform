/** Longest note a landlord can send with a review request (matches `request_listing_review`). */
export const LISTING_REVIEW_NOTE_MAX_LENGTH = 1000;
export const LISTING_REVIEW_NOTE_MIN_LENGTH = 3;

export interface ListingReviewRequest {
  status: 'open' | 'resolved' | 'dismissed';
  note: string | null;
  decisionNote: string | null;
  createdAt: string | null;
  resolvedAt: string | null;
}

/** What a landlord sees about their listing's admin visibility (`get_listing_review_state`). */
export interface ListingReviewState {
  hidden: boolean;
  reason: string | null;
  hiddenAt: string | null;
  request: ListingReviewRequest | null;
}

const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value : null;

/** Reads the RPC's JSON defensively; anything unusable means "not hidden", so no banner. */
export function parseListingReviewState(raw: unknown): ListingReviewState {
  const none: ListingReviewState = { hidden: false, reason: null, hiddenAt: null, request: null };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return none;
  const data = raw as Record<string, unknown>;

  let request: ListingReviewRequest | null = null;
  const rawRequest = data.request;
  if (rawRequest && typeof rawRequest === 'object' && !Array.isArray(rawRequest)) {
    const r = rawRequest as Record<string, unknown>;
    if (r.status === 'open' || r.status === 'resolved' || r.status === 'dismissed') {
      request = {
        status: r.status,
        note: text(r.note),
        decisionNote: text(r.decisionNote),
        createdAt: text(r.createdAt),
        resolvedAt: text(r.resolvedAt),
      };
    }
  }

  return {
    hidden: data.hidden === true,
    reason: text(data.reason),
    hiddenAt: text(data.hiddenAt),
    request,
  };
}

export type ListingReviewBanner = 'none' | 'hidden' | 'pending' | 'declined';

/**
 * Which banner a landlord's listing shows: nothing when visible; "pending"
 * while a request is open; "declined" when the latest request was turned down
 * (they can send another); otherwise just "hidden" with the reason.
 */
export function getListingReviewBanner(state: ListingReviewState): ListingReviewBanner {
  if (!state.hidden) return 'none';
  if (state.request?.status === 'open') return 'pending';
  if (state.request?.status === 'dismissed') return 'declined';
  return 'hidden';
}

export function validateListingReviewNote(note: string): string | null {
  const trimmed = note.trim();
  if (trimmed.length < LISTING_REVIEW_NOTE_MIN_LENGTH) return 'Tell us what you fixed.';
  if (trimmed.length > LISTING_REVIEW_NOTE_MAX_LENGTH) {
    return `Keep the note under ${LISTING_REVIEW_NOTE_MAX_LENGTH} characters.`;
  }
  return null;
}
