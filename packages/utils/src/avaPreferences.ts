// The tenant's saved rental preferences (`users.preferences`) as Ava uses them.
// They stay on the device: Ava reads them locally to summarise them or to start
// a search ("based on my preferences"), and they are never sent to the model.

import {
  AI_SEARCH_MAX_BUDGET,
  EMPTY_AI_SEARCH_FILTERS,
  countAiSearchFilters,
  parseSearchKeywords,
  type AiSearchFilters,
} from './aiSearch';
import type { AvaLanguage } from './avaLanguage';
import { resolveLandmark } from './avaLandmarks';
import {
  BROWSE_DEFAULT_BUDGET_MAX,
  BROWSE_DEFAULT_BUDGET_MIN,
  hasMeaningfulPreferences,
  type BrowseRowPreferences,
} from './browseRows';

/** The saved preferences (the stored object fits structurally). */
export interface AvaPreferences extends BrowseRowPreferences {
  kindOfPets?: string[];
  noOfPets?: number;
  noOfParkingSpots?: number;
}

export type AvaPreferenceIntent = 'summarize' | 'apply';

const withThousands = (amount: number) =>
  String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/** True when the tenant saved something beyond the default budget. */
export function hasAvaPreferences(prefs: AvaPreferences | null | undefined): prefs is AvaPreferences {
  return hasMeaningfulPreferences(prefs);
}

/** Bedroom range a saved choice stands for. */
function bedroomRange(choice: string | null): { min: string; max: number | null } | null {
  if (choice === '1-2 Bedrooms') return { min: '1', max: 2 };
  if (choice === '2-4 Bedrooms') return { min: '2', max: 4 };
  if (choice === '4+ Bedrooms') return { min: '4+', max: null };
  return null;
}

/**
 * The search a tenant's saved preferences describe. The default budget bounds
 * count as "not answered", and a budget at or above the search cap adds no
 * ceiling, the same as Browse does.
 */
export function preferencesToFilters(prefs: AvaPreferences): AiSearchFilters {
  const range = bedroomRange(prefs.bedroomCount);
  const hasMin = prefs.budgetMin > BROWSE_DEFAULT_BUDGET_MIN;
  const hasMax = prefs.budgetMax < Math.min(BROWSE_DEFAULT_BUDGET_MAX, AI_SEARCH_MAX_BUDGET);

  return {
    ...EMPTY_AI_SEARCH_FILTERS,
    cities: [...prefs.selectedCities],
    priceMin: hasMin ? prefs.budgetMin : null,
    priceMax: hasMax ? prefs.budgetMax : null,
    bedrooms: (range?.min ?? null) as AiSearchFilters['bedrooms'],
    bedroomsMax: range?.max ?? null,
    amenities: [
      ...(prefs.hasPets ? ['petfriendly'] : []),
      ...(prefs.hasParking ? ['parking'] : []),
    ],
  };
}

const TEXT = {
  en: {
    intro: "Here's what you saved in your rental preferences:",
    area: 'Area',
    budget: 'Budget',
    bedrooms: 'Bedrooms',
    household: 'Household',
    pets: 'Pets',
    parking: 'Parking',
    smoker: 'Smoker in the household',
    accessibility: 'Accessibility needs',
    yes: 'yes',
    perMonth: 'a month',
    upTo: (amount: string) => `up to ₱${amount}`,
    from: (amount: string) => `from ₱${amount}`,
    spots: (count: number) => `${count} spot${count === 1 ? '' : 's'}`,
  },
  tl: {
    intro: 'Narito ang mga na-save mo sa rental preferences mo:',
    area: 'Lugar',
    budget: 'Budget',
    bedrooms: 'Bedrooms',
    household: 'Sambahayan',
    pets: 'Alagang hayop',
    parking: 'Parking',
    smoker: 'May naninigarilyo sa sambahayan',
    accessibility: 'Kailangan ng accessibility',
    yes: 'oo',
    perMonth: 'kada buwan',
    upTo: (amount: string) => `hanggang ₱${amount}`,
    from: (amount: string) => `mula ₱${amount}`,
    spots: (count: number) => `${count} na puwesto`,
  },
} as const;

/** The saved preferences in plain words, one per line, only what was answered. */
export function describePreferences(prefs: AvaPreferences, language: AvaLanguage): string {
  const t = TEXT[language];
  const lines: string[] = [];

  if (prefs.selectedCities.length > 0) lines.push(`${t.area}: ${prefs.selectedCities.join(', ')}`);

  const hasMin = prefs.budgetMin > BROWSE_DEFAULT_BUDGET_MIN;
  const hasMax = prefs.budgetMax < BROWSE_DEFAULT_BUDGET_MAX;
  if (hasMin && hasMax) {
    lines.push(`${t.budget}: ₱${withThousands(prefs.budgetMin)}–₱${withThousands(prefs.budgetMax)} ${t.perMonth}`);
  } else if (hasMax) lines.push(`${t.budget}: ${t.upTo(withThousands(prefs.budgetMax))} ${t.perMonth}`);
  else if (hasMin) lines.push(`${t.budget}: ${t.from(withThousands(prefs.budgetMin))} ${t.perMonth}`);

  if (prefs.bedroomCount) lines.push(`${t.bedrooms}: ${prefs.bedroomCount.replace(/ Bedrooms?$/, '')}`);
  if (prefs.householdSize) lines.push(`${t.household}: ${prefs.householdSize}`);

  if (prefs.hasPets) {
    const kinds = (prefs.kindOfPets ?? []).join(', ');
    lines.push(`${t.pets}: ${kinds || t.yes}`);
  }
  if (prefs.hasParking) {
    lines.push(`${t.parking}: ${prefs.noOfParkingSpots ? t.spots(prefs.noOfParkingSpots) : t.yes}`);
  }
  if (prefs.hasSmoker) lines.push(`${t.smoker}: ${t.yes}`);
  if (prefs.hasDisability) lines.push(`${t.accessibility}: ${t.yes}`);

  return [t.intro, ...lines.map((line) => `• ${line}`)].join('\n');
}

const PREFERENCE_WORDS = /\b(?:preferences?|preference ko|kagustuhan)\b/;
const SUMMARY_WORDS =
  /\b(?:summari[sz]e|summary|recap|review|what(?:'s| is| are)|tell me|list|ano ang|ano ba|ipakita)\b/;
const SEARCH_WORDS =
  /\b(?:find|search|recommend|suggest|look for|based on|according to|using|use|match|fit|hanap|ayon sa|batay sa|gamit)\b/;
const FOR_ME = /\b(?:recommend|suggest)\b.*\b(?:for me|para sa akin|sa akin)\b/;

/** True when the message already carries a search of its own (filters or a place). */
function hasSearchDetails(text: string): boolean {
  return countAiSearchFilters(parseSearchKeywords(text)) > 0 || resolveLandmark(text).status !== 'none';
}

/**
 * Whether the message is about the tenant's saved preferences: asking what they
 * are (`summarize`) or asking Ava to search with them (`apply`). A message that
 * merely mentions them while stating its own search ("my preferences are 2BR in
 * Malabon"), or asks for a recommendation near a place, is an ordinary search.
 */
export function asksAboutPreferences(message: string): AvaPreferenceIntent | null {
  const text = message.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!text) return null;

  if (PREFERENCE_WORDS.test(text)) {
    // "Find apartments based on my preferences" searches; "summarize my preferences" does not.
    if (SEARCH_WORDS.test(text) && !/\b(?:summari[sz]e|summary)\b/.test(text)) return 'apply';
    if (SUMMARY_WORDS.test(text)) return 'summarize';
    return hasSearchDetails(text) ? null : 'summarize';
  }
  if (FOR_ME.test(text) && !hasSearchDetails(text)) return 'apply';
  return null;
}
