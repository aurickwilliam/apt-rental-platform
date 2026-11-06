// Everything Ava says without the model, in English and Tagalog. Gemini writes
// the conversational replies; these cover the keyword fallback, errors and all
// location results, whose distances must come from real coordinates and so are
// never written by the model.

import type { AvaLanguage } from './avaLanguage';

export interface AvaStrings {
  askForDetails: string;
  found: string;
  noResults: string;
  limitNote: string;
  listingsError: string;
  genericError: string;
  loosenQuickReplies: string[];
  anyArea: string;

  /** Results within the near radius. */
  nearReply: (place: string) => string;
  /** Nothing right next to the place; closest alternatives are in nearby areas. */
  nearbyReply: (place: string, distance: string) => string;
  /** The closest listings are far from the place. */
  fartherReply: (place: string, distance: string) => string;
  /** Matches exist but none has a map location. */
  unlocatedReply: (place: string) => string;
  noneNearReply: (place: string) => string;
  /** Which of several places the tenant means. */
  clarifyReply: (label: string) => string;
  unknownPlaceReply: (place: string) => string;
  moreReply: string;
  noMoreReply: string;

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
    listingsError: "Sorry, I couldn't load listings right now. Please try again.",
    genericError: "Sorry, I couldn't process that. Please try again.",
    loosenQuickReplies: ['Any area in CAMANAVA', 'Higher budget', 'Any unit type'],
    anyArea: 'Any area in CAMANAVA',

    nearReply: (place) =>
      `Sure! Here are apartments closest to ${place}, nearest first. Distances are straight-line, not travel time.`,
    nearbyReply: (place, distance) =>
      `I couldn't find available apartment listings immediately near ${place}. However, I found some alternatives in nearby areas that may be convenient for you. The closest is about ${distance} away in a straight line.`,
    fartherReply: (place, distance) =>
      `There are no listings close to ${place} right now. The closest I found is about ${distance} away in a straight line, so these are farther than you may want. Here they are, nearest first.`,
    unlocatedReply: (place) =>
      `I found listings that match, but they don't have map locations yet, so I can't tell how far they are from ${place}.`,
    noneNearReply: (place) =>
      `I couldn't find any available listings that match your requirements near ${place} or elsewhere in CAMANAVA. Try a higher budget or fewer requirements.`,
    clarifyReply: (label) => `Which ${label} do you mean?`,
    unknownPlaceReply: (place) =>
      `I can't pinpoint ${place} yet. Tell me the city or barangay and I'll search there.`,
    moreReply: 'Here are more options.',
    noMoreReply: "That's everything I have for this search. Want to adjust the budget or area?",

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
    listingsError: 'Pasensya na, hindi ko ma-load ang mga listing ngayon. Pakisubukan ulit.',
    genericError: 'Pasensya na, hindi ko naintindihan iyon. Pakisubukan ulit.',
    loosenQuickReplies: ['Kahit saan sa CAMANAVA', 'Mas mataas na budget', 'Kahit anong uri'],
    anyArea: 'Kahit saan sa CAMANAVA',

    nearReply: (place) =>
      `Oo! Narito ang mga apartment na pinakamalapit sa ${place}, mula sa pinakamalapit. Ang layo ay tuwid na linya, hindi oras ng biyahe.`,
    nearbyReply: (place, distance) =>
      `Wala akong nahanap na available na apartment na malapit mismo sa ${place}. Pero may mga alternatibo sa mga karatig na lugar na maaaring maginhawa para sa iyo. Ang pinakamalapit ay mga ${distance} ang layo (tuwid na linya).`,
    fartherReply: (place, distance) =>
      `Wala pang listing na malapit sa ${place} ngayon. Ang pinakamalapit na nakita ko ay mga ${distance} ang layo (tuwid na linya), kaya mas malayo ito kaysa sa gusto mo. Narito ang mga ito, mula sa pinakamalapit.`,
    unlocatedReply: (place) =>
      `May nahanap akong mga tugmang listing, pero wala pa silang lokasyon sa mapa, kaya hindi ko masabi kung gaano kalayo ang mga ito sa ${place}.`,
    noneNearReply: (place) =>
      `Wala akong nahanap na available na listing na tugma sa mga hinihingi mo malapit sa ${place} o saanman sa CAMANAVA. Subukan ang mas mataas na budget o mas kaunting requirements.`,
    clarifyReply: (label) => `Alin sa mga ${label} ang ibig mong sabihin?`,
    unknownPlaceReply: (place) =>
      `Hindi ko pa matukoy kung nasaan ang ${place}. Sabihin mo ang lungsod o barangay at doon ako maghahanap.`,
    moreReply: 'Narito ang iba pang mapagpipilian.',
    noMoreReply: 'Iyan na ang lahat ng mayroon ako para sa search na ito. Gusto mo bang baguhin ang budget o lugar?',

    distanceNote: (distance, place) => `${distance} mula sa ${place} (tuwid na linya)`,
    withinBudget: (amount) => `pasok sa ${peso(amount)} mong budget`,
    bedrooms: (count) => `${count} bedroom`,
    hasAmenities: (labels) => `may ${labels}`,
  },
};
