import {
  BROWSE_ROW_LIMIT,
  rankCandidates,
  type BrowseRowCandidate,
  type BrowseRowPreferences,
  type ScoredBrowseCandidate,
} from "@repo/utils";

/** City/budget-scoped web pool: shared relevance, then affordability, rating and ID. */
export function rankRecommendationCandidates<T extends BrowseRowCandidate>(
  pool: T[],
  preferences: BrowseRowPreferences,
  limit = BROWSE_ROW_LIMIT,
): ScoredBrowseCandidate<T>[] {
  const priced = pool.filter((candidate): candidate is T & { monthly_rent: number } =>
    typeof candidate.monthly_rent === "number" && Number.isFinite(candidate.monthly_rent) && candidate.monthly_rent > 0,
  );
  // Rank the entire bounded pool, not a pre-truncated rating-ranked shortlist:
  // an equally relevant cheaper listing beyond position 15 must still compete.
  return rankCandidates(priced, preferences, priced.length)
    .sort((a, b) =>
      b.score - a.score ||
      a.candidate.monthly_rent - b.candidate.monthly_rent ||
      (b.candidate.average_rating ?? 0) - (a.candidate.average_rating ?? 0) ||
      (a.candidate.id < b.candidate.id ? -1 : a.candidate.id > b.candidate.id ? 1 : 0),
    )
    .slice(0, limit);
}
