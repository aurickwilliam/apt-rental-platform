import { supabase } from "@repo/supabase";
import { fetchRecommendationCandidates, type RecommendationClient, type RecommendationPreferences } from "@repo/utils/recommendations";

export function fetchPersonalizedCandidates(preferences: RecommendationPreferences, signal?: AbortSignal) {
  return fetchRecommendationCandidates(supabase as unknown as RecommendationClient, preferences, signal);
}
