import { supabase } from "@repo/supabase";
import { CAMANAVA_CITIES } from "@repo/constants";
import {
  countAiSearchFilters,
  parseSearchKeywords,
  sanitizeAiFilters,
  type AiSearchFilters,
} from "@repo/utils";

import { type ApartmentCardProps } from "@/components/cards/ApartmentCard";
import {
  APARTMENT_CARD_SELECT,
  toApartmentCards,
  type ApartmentCardRow,
} from "@/service/search/apartmentCards";

// Client for the `ai-search` edge function (Ava, the chatbot search). The
// function asks Gemini to read the conversation; this service always
// sanitizes what comes back and searches listings itself, so RLS decides
// which apartments appear. When Gemini is unavailable, the daily limit is
// reached or the request fails, the last message is read with the keyword
// parser instead, so Ava keeps searching without the model.

export const AVA_RESULT_LIMIT = 5;

export type AvaSource = "gemini" | "fallback" | "limit";

export interface AvaTurn {
  role: "user" | "assistant";
  text: string;
}

export interface AvaAnswer {
  source: AvaSource;
  reply: string | null;
  quickReplies: string[];
  /** Said instead of `reply` when the search finds nothing (Gemini answers before the search). */
  noResultsReply: string | null;
  noResultsQuickReplies: string[];
  filters: AiSearchFilters;
}

export interface AvaListings {
  listings: ApartmentCardProps[];
  total: number;
}

interface AiSearchResponse {
  source?: string;
  reply?: unknown;
  quickReplies?: unknown;
  noResultsReply?: unknown;
  noResultsQuickReplies?: unknown;
  filters?: unknown;
}

const toStringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

function lastUserText(turns: AvaTurn[]): string {
  return [...turns].reverse().find((turn) => turn.role === "user")?.text ?? "";
}

// Fallback reading: the whole conversation's user messages, so details from
// earlier turns ("sa Malabon", then "2 bedrooms") still count.
function parseConversation(turns: AvaTurn[]): AiSearchFilters {
  const userText = turns
    .filter((turn) => turn.role === "user")
    .map((turn) => turn.text)
    .join(". ");
  return parseSearchKeywords(userText);
}

export async function askAva(turns: AvaTurn[]): Promise<AvaAnswer> {
  const fallback = (source: AvaSource): AvaAnswer => ({
    source,
    reply: null,
    quickReplies: [],
    noResultsReply: null,
    noResultsQuickReplies: [],
    filters: parseConversation(turns),
  });

  if (!lastUserText(turns)) return fallback("fallback");

  const { data, error } = await supabase.functions.invoke<AiSearchResponse>("ai-search", {
    body: { messages: turns },
  });

  if (error || !data) {
    console.error("Ava request failed:", error?.message ?? "empty response");
    return fallback("fallback");
  }

  if (data.source === "limit") return fallback("limit");
  if (data.source !== "gemini" || typeof data.reply !== "string") return fallback("fallback");

  return {
    source: "gemini",
    reply: data.reply,
    quickReplies: toStringList(data.quickReplies),
    noResultsReply: typeof data.noResultsReply === "string" ? data.noResultsReply : null,
    noResultsQuickReplies: toStringList(data.noResultsQuickReplies),
    filters: sanitizeAiFilters(data.filters),
  };
}

export async function fetchAvaListings(
  filters: AiSearchFilters,
  limit: number = AVA_RESULT_LIMIT,
): Promise<AvaListings> {
  // Same visibility guards as the search tab (`useSearchLogic`).
  let query = supabase
    .from("apartments")
    .select(APARTMENT_CARD_SELECT, { count: "estimated" })
    .is("deleted_at", null)
    .eq("is_hidden_by_admin", false)
    .in("status", ["available", "unverified"])
    .range(0, limit - 1);

  const cities = filters.cities.length > 0 ? filters.cities : [...CAMANAVA_CITIES];
  query = query.in("city", cities);

  if (filters.priceMin !== null) query = query.gte("monthly_rent", filters.priceMin);
  if (filters.priceMax !== null) query = query.lte("monthly_rent", filters.priceMax);
  if (filters.types.length > 0) query = query.in("type", filters.types);

  if (filters.bedrooms === "4+") query = query.gte("no_bedrooms", 4);
  else if (filters.bedrooms !== null) query = query.eq("no_bedrooms", Number(filters.bedrooms));

  if (filters.bathrooms === "4+") query = query.gte("no_bathrooms", 4);
  else if (filters.bathrooms !== null) query = query.eq("no_bathrooms", Number(filters.bathrooms));

  if (filters.furnishing.length > 0) query = query.in("furnished_type", filters.furnishing);
  if (filters.amenities.length > 0) query = query.contains("amenities", filters.amenities);
  if (filters.verifiedOnly) query = query.eq("is_verified", true);

  // The keyword is already limited to letters, digits, spaces and hyphens.
  if (filters.keyword !== null) {
    query = query.or(
      `name.ilike.%${filters.keyword}%,barangay.ilike.%${filters.keyword}%,city.ilike.%${filters.keyword}%`,
    );
  }

  switch (filters.sort) {
    case "price_asc":
      query = query.order("monthly_rent", { ascending: true });
      break;
    case "price_desc":
      query = query.order("monthly_rent", { ascending: false });
      break;
    case "most_popular":
      query = query.order("average_rating", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }
  query = query.order("id", { ascending: true });

  const { data, error, count } = await query;
  if (error) throw error;

  const rows = (data ?? []) as unknown as ApartmentCardRow[];
  return { listings: toApartmentCards(rows), total: count ?? rows.length };
}

export function hasSearchableDetails(filters: AiSearchFilters): boolean {
  return countAiSearchFilters(filters) > 0;
}
