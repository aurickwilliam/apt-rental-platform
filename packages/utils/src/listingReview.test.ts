import {
  getListingReviewBanner,
  parseListingReviewState,
  validateListingReviewNote,
  LISTING_REVIEW_NOTE_MAX_LENGTH,
} from './listingReview';

describe('parseListingReviewState', () => {
  it('treats missing or malformed data as not hidden', () => {
    for (const raw of [null, undefined, 'x', 5, [], {}]) {
      expect(parseListingReviewState(raw)).toEqual({ hidden: false, reason: null, hiddenAt: null, request: null });
    }
  });

  it('reads a hidden listing with an open request', () => {
    const state = parseListingReviewState({
      hidden: true,
      reason: 'Fake photos',
      hiddenAt: '2026-11-04T10:00:00Z',
      request: { status: 'open', note: 'Replaced them', decisionNote: null, createdAt: '2026-11-05T01:00:00Z', resolvedAt: null },
    });
    expect(state.hidden).toBe(true);
    expect(state.reason).toBe('Fake photos');
    expect(state.request?.status).toBe('open');
    expect(state.request?.note).toBe('Replaced them');
  });

  it('ignores a request with an unknown status', () => {
    expect(parseListingReviewState({ hidden: true, request: { status: 'weird' } }).request).toBeNull();
  });
});

describe('getListingReviewBanner', () => {
  const base = { hidden: true, reason: 'x', hiddenAt: null };
  const request = (status: 'open' | 'resolved' | 'dismissed') => ({
    status, note: 'n', decisionNote: null, createdAt: null, resolvedAt: null,
  });

  it('shows nothing for a visible listing, even with an old request', () => {
    expect(getListingReviewBanner({ ...base, hidden: false, request: request('resolved') })).toBe('none');
  });

  it('shows hidden, pending and declined', () => {
    expect(getListingReviewBanner({ ...base, request: null })).toBe('hidden');
    expect(getListingReviewBanner({ ...base, request: request('open') })).toBe('pending');
    expect(getListingReviewBanner({ ...base, request: request('dismissed') })).toBe('declined');
  });

  it('shows hidden again when an old request was resolved but the listing was hidden anew', () => {
    expect(getListingReviewBanner({ ...base, request: request('resolved') })).toBe('hidden');
  });
});

describe('validateListingReviewNote', () => {
  it('requires a short real note and caps the length', () => {
    expect(validateListingReviewNote('  ')).not.toBeNull();
    expect(validateListingReviewNote('ok')).not.toBeNull();
    expect(validateListingReviewNote('Fixed the price')).toBeNull();
    expect(validateListingReviewNote('x'.repeat(LISTING_REVIEW_NOTE_MAX_LENGTH + 1))).not.toBeNull();
  });
});
