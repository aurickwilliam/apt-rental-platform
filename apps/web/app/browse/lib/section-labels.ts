import type { TranslationKey } from "@repo/i18n";

/**
 * The discovery section ids come from the `get_search_sections` RPC, which
 * always runs for CAMANAVA. The database still owns the cohort logic; the
 * client only relabels the known ids, and anything unknown keeps the English
 * title the RPC returned.
 */
const SECTION_TITLE_KEYS: Record<string, TranslationKey> = {
  for_you: "browse.section.forYou.title",
  verified: "browse.section.verified",
  budget_low: "browse.section.budgetLow",
  studio: "browse.section.studio",
  top_rated: "browse.section.topRated",
  near_you: "browse.section.nearYou",
  spacious: "browse.section.spacious",
  all_results: "browse.section.allResults",
};

export function sectionTitleKey(id: string): TranslationKey | null {
  return SECTION_TITLE_KEYS[id] ?? null;
}
