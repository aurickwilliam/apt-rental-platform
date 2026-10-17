export const TENANT_LOVED_APARTMENT_LIMIT = 10;
export const REVIEW_CONFIDENCE_THRESHOLD = 5;

interface RatedApartment {
  average_rating: number | null;
  no_ratings: number | null;
  created_at: string;
}

function ratingCount(apartment: RatedApartment): number {
  return Math.max(0, apartment.no_ratings ?? 0);
}

function weightedRating(
  apartment: RatedApartment,
  overallAverageRating: number,
): number {
  const reviews = ratingCount(apartment);
  const rating = apartment.average_rating ?? 0;

  return (
    (reviews * rating + REVIEW_CONFIDENCE_THRESHOLD * overallAverageRating) /
    (reviews + REVIEW_CONFIDENCE_THRESHOLD)
  );
}

/**
 * Prioritizes apartments with tenant reviews. A Bayesian weighted rating keeps
 * a single high rating from outranking listings with a proven review history.
 * When fewer than the display limit have reviews, the newest eligible listings
 * fill the remaining slots.
 */
export function rankTenantLovedApartments<T extends RatedApartment>(
  apartments: readonly T[],
  limit = TENANT_LOVED_APARTMENT_LIMIT,
): T[] {
  const reviewed = apartments.filter((apartment) => ratingCount(apartment) > 0);
  const totalRatings = reviewed.reduce(
    (total, apartment) => total + ratingCount(apartment),
    0,
  );
  const overallAverageRating =
    totalRatings === 0
      ? 0
      : reviewed.reduce(
          (total, apartment) =>
            total + ratingCount(apartment) * (apartment.average_rating ?? 0),
          0,
        ) / totalRatings;

  const byNewest = (first: T, second: T) =>
    second.created_at.localeCompare(first.created_at);
  const byTenantLove = (first: T, second: T) =>
    weightedRating(second, overallAverageRating) -
      weightedRating(first, overallAverageRating) ||
    ratingCount(second) - ratingCount(first) ||
    byNewest(first, second);

  return [
    ...reviewed.toSorted(byTenantLove),
    ...apartments
      .filter((apartment) => ratingCount(apartment) === 0)
      .toSorted(byNewest),
  ].slice(0, limit);
}
