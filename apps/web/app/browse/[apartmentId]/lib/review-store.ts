export type StoredReview = {
  id: string;
  apartmentId: string;
  rating: number;
  reviewText: string;
  stayPeriod?: string;
  createdAt: string;
};

export type SaveReviewPayload = {
  rating: number;
  reviewText: string;
  stayPeriod?: string;
};

const STORAGE_KEY = "apt.apartment_reviews";

function safeParse(raw: string | null): Record<string, StoredReview[]> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, StoredReview[]>)
      : {};
  } catch {
    return {};
  }
}

function readStore(): Record<string, StoredReview[]> {
  if (typeof localStorage === "undefined") return {};
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

export function getApartmentReviews(apartmentId: string): StoredReview[] {
  return readStore()[apartmentId] ?? [];
}

export function saveApartmentReview(
  apartmentId: string,
  payload: SaveReviewPayload
): StoredReview {
  const stored: StoredReview = {
    ...payload,
    id: crypto.randomUUID(),
    apartmentId,
    createdAt: new Date().toISOString(),
  };

  const next: Record<string, StoredReview[]> = {
    ...readStore(),
    [apartmentId]: [...getApartmentReviews(apartmentId), stored],
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  return stored;
}