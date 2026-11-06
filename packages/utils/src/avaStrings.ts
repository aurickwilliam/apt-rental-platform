// Everything Ava says without the model, in English and Tagalog. Gemini writes
// the conversational replies; these cover the keyword fallback, errors and all
// location results, whose distances must come from real coordinates and so are
// never written by the model.

import type { AvaLanguage } from './avaLanguage';
import type { AvaSmallTalkKind } from './avaSmallTalk';

export interface AvaStrings {
  askForDetails: string;
  found: string;
  noResults: string;
  limitNote: string;
  /** Said when the sign-in expired, so the assistant could not be reached. */
  sessionNote: string;
  listingsError: string;
  genericError: string;
  loosenQuickReplies: string[];
  anyArea: string;

  /** Results within the near radius. */
  /** `byPrice`: the listings are ordered cheapest first, not nearest first. */
  nearReply: (place: string, byPrice?: boolean) => string;
  /** Nothing right next to the place; closest alternatives are in nearby areas. */
  nearbyReply: (place: string, distance: string) => string;
  /** The closest listings are far from the place. */
  fartherReply: (place: string, distance: string, byPrice?: boolean) => string;
  /** Matches exist but none has a map location. */
  unlocatedReply: (place: string) => string;
  noneNearReply: (place: string) => string;
  /** Which of several places the tenant means. */
  clarifyReply: (label: string) => string;
  unknownPlaceReply: (place: string) => string;
  /** No exact match: these are the closest listings; `differences` names what differs. */
  relaxedReply: (differences: string) => string;
  relaxedIntro: string;
  differenceLabels: { area: string; budget: string; bedrooms: string; amenities: string };
  overBudget: (amount: string) => string;
  underBudget: (amount: string) => string;
  bedroomsDiffer: (count: number) => string;
  missingAmenity: (label: string) => string;
  outsideArea: (city: string) => string;
  /** Ava's own answers to small talk; each ends by steering back to apartments. */
  smallTalk: Record<AvaSmallTalkKind, string>;
  /** Off-topic message the model's reply could not be used for. */
  offTopicFallback: string;
  noPreferences: string;
  usingPreferences: string;
  preferencesFollowUp: string;
  searchWithPreferences: string;
  moreReply: string;
  /** "Show me more" when the remaining listings are farther than the near radius. */
  moreFartherReply: (place: string, distance: string) => string;
  noMoreReply: string;

  /** The one-line summary of what Ava is searching with. */
  searching: string;
  nearPlace: (place: string) => string;
  upTo: (amount: string) => string;
  fromAmount: (amount: string) => string;
  cheapestFirst: string;
  priciestFirst: string;
  verifiedOnly: string;

  /** Caption lines under a listing. */
  distanceNote: (distance: string, place: string) => string;
  withinBudget: (amount: string) => string;
  bedrooms: (count: number) => string;
  hasAmenities: (labels: string) => string;
}

const peso = (amount: string) => `₱${amount}`;

export const AVA_STRINGS: Record<AvaLanguage, AvaStrings> = {
  en: {
    askForDetails:
      "I'd love to help! Tell me the area, your monthly budget, or how many bedrooms you need.",
    found: 'Here are places that match what you told me.',
    noResults:
      "I couldn't find a match yet. Try a higher budget, fewer must-haves, or another area.",
    limitNote: "I've answered a lot today, so I'm using simple search for now.",
    sessionNote: "I couldn't reach my assistant because your session expired, so I'm using simple search. Please sign in again.",
    listingsError: "Sorry, I couldn't load listings right now. Please try again.",
    genericError: "Sorry, I couldn't process that. Please try again.",
    loosenQuickReplies: ['Any area in CAMANAVA', 'Higher budget', 'Any unit type'],
    anyArea: 'Any area in CAMANAVA',

    nearReply: (place, byPrice) =>
      `Sure! Here are apartments closest to ${place}, ${byPrice ? 'cheapest first' : 'nearest first'}. Distances are straight-line, not travel time.`,
    nearbyReply: (place, distance) =>
      `I couldn't find available apartment listings immediately near ${place}. However, I found some alternatives in nearby areas that may be convenient for you. The closest is about ${distance} away in a straight line.`,
    fartherReply: (place, distance, byPrice) =>
      `There are no listings close to ${place} right now. The closest I found is about ${distance} away in a straight line, so these are farther than you may want. Here they are, ${byPrice ? 'cheapest first' : 'nearest first'}.`,
    unlocatedReply: (place) =>
      `I found listings that match, but they don't have map locations yet, so I can't tell how far they are from ${place}.`,
    noneNearReply: (place) =>
      `I couldn't find any available listings that match your requirements near ${place} or elsewhere in CAMANAVA. Try a higher budget or fewer requirements.`,
    clarifyReply: (label) => `Which ${label} do you mean?`,
    unknownPlaceReply: (place) =>
      `I can't pinpoint ${place} yet. Tell me the city or barangay and I'll search there.`,
    relaxedReply: (differences) =>
      `I couldn't find an exact match, so here are the closest options. They differ on: ${differences}.`,
    relaxedIntro: "I couldn't find an exact match for everything, so I loosened your filters.",
    differenceLabels: { area: 'area', budget: 'budget', bedrooms: 'bedrooms', amenities: 'amenities' },
    overBudget: (amount) => `${amount} over your budget`,
    underBudget: (amount) => `${amount} under your minimum`,
    bedroomsDiffer: (count) => `${count} bedroom${count === 1 ? '' : 's'}, not what you asked for`,
    missingAmenity: (label) => `no ${label} listed`,
    outsideArea: (city) => `in ${city}, outside your area`,
    smallTalk: {
      greeting: "Hi there! I'm Ava, your apartment-hunting buddy. Tell me the area, your monthly budget or how many bedrooms you need, and let's find your place.",
      howAreYou:
        "Doing great, thanks for asking! I run on electricity instead of rice, but I hear that's a perfectly good lunch. Now, let's get back to finding you an apartment: what area and budget do you have in mind?",
      thanks: "Anytime! Want to tweak the search, or look at more apartments?",
      who: "I'm Ava, APT's virtual assistant. I help you find rentals in Caloocan, Malabon, Navotas and Valenzuela. Tell me what you're looking for!",
      bye: "Take care! Come back anytime you're ready to find a place.",
    },
    offTopicFallback:
      "Ha, that's a fun one, but apartments are my thing. Let's get back to finding your place: tell me the area, budget or bedrooms.",
    noPreferences:
      "You haven't saved any rental preferences yet. You can set them in your settings, or just tell me the area, budget and bedrooms.",
    usingPreferences: 'Using your saved preferences.',
    preferencesFollowUp: 'Want me to search with these?',
    searchWithPreferences: 'Search with my preferences',
    moreReply: 'Here are more options.',
    moreFartherReply: (place, distance) =>
      `Here are more options. The closest remaining one is about ${distance} from ${place} in a straight line.`,
    noMoreReply: "That's everything I have for this search. Want to adjust the budget or area?",

    searching: 'Searching',
    nearPlace: (place) => `near ${place}`,
    upTo: (amount) => `up to ${peso(amount)}`,
    fromAmount: (amount) => `from ${peso(amount)}`,
    cheapestFirst: 'cheapest first',
    priciestFirst: 'highest price first',
    verifiedOnly: 'verified only',

    distanceNote: (distance, place) => `${distance} from ${place} (straight-line)`,
    withinBudget: (amount) => `within your ${peso(amount)} budget`,
    bedrooms: (count) => `${count} bedroom${count === 1 ? '' : 's'}`,
    hasAmenities: (labels) => `has ${labels}`,
  },
  tl: {
    askForDetails:
      'Gusto kitang tulungan! Sabihin mo lang ang lugar, buwanang budget, o ilang kwarto ang kailangan mo.',
    found: 'Narito ang mga tugma sa sinabi mo.',
    noResults:
      'Wala pa akong nahanap na tugma. Subukan ang mas mataas na budget, mas kaunting requirements, o ibang lugar.',
    limitNote: 'Marami na akong nasagot ngayong araw, kaya simpleng search muna ang gagamitin ko.',
    sessionNote: 'Hindi ko naabot ang assistant dahil nag-expire ang session mo, kaya simpleng search muna. Mag-sign in ulit.',
    listingsError: 'Pasensya na, hindi ko ma-load ang mga listing ngayon. Pakisubukan ulit.',
    genericError: 'Pasensya na, hindi ko naintindihan iyon. Pakisubukan ulit.',
    loosenQuickReplies: ['Kahit saan sa CAMANAVA', 'Mas mataas na budget', 'Kahit anong uri'],
    anyArea: 'Kahit saan sa CAMANAVA',

    nearReply: (place, byPrice) =>
      `Oo! Narito ang mga apartment na pinakamalapit sa ${place}, mula sa ${byPrice ? 'pinakamura' : 'pinakamalapit'}. Ang layo ay tuwid na linya, hindi oras ng biyahe.`,
    nearbyReply: (place, distance) =>
      `Wala akong nahanap na available na apartment na malapit mismo sa ${place}. Pero may mga alternatibo sa mga karatig na lugar na maaaring maginhawa para sa iyo. Ang pinakamalapit ay mga ${distance} ang layo (tuwid na linya).`,
    fartherReply: (place, distance, byPrice) =>
      `Wala pang listing na malapit sa ${place} ngayon. Ang pinakamalapit na nakita ko ay mga ${distance} ang layo (tuwid na linya), kaya mas malayo ito kaysa sa gusto mo. Narito ang mga ito, mula sa ${byPrice ? 'pinakamura' : 'pinakamalapit'}.`,
    unlocatedReply: (place) =>
      `May nahanap akong mga tugmang listing, pero wala pa silang lokasyon sa mapa, kaya hindi ko masabi kung gaano kalayo ang mga ito sa ${place}.`,
    noneNearReply: (place) =>
      `Wala akong nahanap na available na listing na tugma sa mga hinihingi mo malapit sa ${place} o saanman sa CAMANAVA. Subukan ang mas mataas na budget o mas kaunting requirements.`,
    clarifyReply: (label) => `Alin sa mga ${label} ang ibig mong sabihin?`,
    unknownPlaceReply: (place) =>
      `Hindi ko pa matukoy kung nasaan ang ${place}. Sabihin mo ang lungsod o barangay at doon ako maghahanap.`,
    relaxedReply: (differences) =>
      `Wala akong nahanap na eksaktong tugma, kaya narito ang pinakamalapit na mga opsyon. Magkaiba sila sa: ${differences}.`,
    relaxedIntro: 'Wala akong nahanap na eksaktong tugma sa lahat, kaya niluwagan ko ang mga filter mo.',
    differenceLabels: { area: 'lugar', budget: 'budget', bedrooms: 'bedrooms', amenities: 'amenities' },
    overBudget: (amount) => `${amount} sobra sa budget mo`,
    underBudget: (amount) => `${amount} kulang sa minimum mo`,
    bedroomsDiffer: (count) => `${count} bedroom, hindi ayon sa hiniling mo`,
    missingAmenity: (label) => `walang nakalistang ${label}`,
    outsideArea: (city) => `nasa ${city}, labas ng lugar mo`,
    smallTalk: {
      greeting: 'Hello! Ako si Ava, kasama mo sa paghahanap ng apartment. Sabihin mo ang lugar, buwanang budget o bilang ng bedrooms, at hanapin natin ang bahay mo.',
      howAreYou:
        'Busog na busog ako sa data, salamat sa pag-alala! Ikaw, kumain ka na ba? Balik na tayo sa paghahanap ng apartment mo: anong lugar at budget ang gusto mo?',
      thanks: 'Walang anuman! Gusto mo bang baguhin ang search, o tumingin pa ng ibang apartment?',
      who: 'Ako si Ava, ang virtual assistant ng APT. Tinutulungan kitang maghanap ng rental sa Caloocan, Malabon, Navotas at Valenzuela. Sabihin mo kung ano ang hanap mo!',
      bye: 'Ingat! Balik ka lang kapag handa ka nang maghanap ng bahay.',
    },
    offTopicFallback:
      'Hehe, masaya iyan, pero apartment ang forte ko. Balik tayo sa paghahanap ng bahay mo: sabihin ang lugar, budget o bedrooms.',
    noPreferences:
      'Wala ka pang na-save na rental preferences. Maaari mo itong itakda sa settings, o sabihin lang ang lugar, budget at bilang ng bedrooms.',
    usingPreferences: 'Ginagamit ko ang na-save mong preferences.',
    preferencesFollowUp: 'Gusto mo bang maghanap gamit ang mga ito?',
    searchWithPreferences: 'Hanapin ayon sa preferences ko',
    moreReply: 'Narito ang iba pang mapagpipilian.',
    moreFartherReply: (place, distance) =>
      `Narito ang iba pang mapagpipilian. Ang pinakamalapit na natitira ay mga ${distance} mula sa ${place} (tuwid na linya).`,
    noMoreReply: 'Iyan na ang lahat ng mayroon ako para sa search na ito. Gusto mo bang baguhin ang budget o lugar?',

    searching: 'Hinahanap',
    nearPlace: (place) => `malapit sa ${place}`,
    upTo: (amount) => `hanggang ${peso(amount)}`,
    fromAmount: (amount) => `mula ${peso(amount)}`,
    cheapestFirst: 'pinakamura muna',
    priciestFirst: 'pinakamahal muna',
    verifiedOnly: 'verified lang',

    distanceNote: (distance, place) => `${distance} mula sa ${place} (tuwid na linya)`,
    withinBudget: (amount) => `pasok sa ${peso(amount)} mong budget`,
    bedrooms: (count) => `${count} bedroom`,
    hasAmenities: (labels) => `may ${labels}`,
  },
};
