import type { reviews as enReviews } from "../en/reviews";

export const reviews: Record<keyof typeof enReviews, string> = {
  "reviews.title": "Ratings at Reviews",
  "reviews.sectionTitle": "Reviews ng mga Tenant",
  "reviews.seeAll": "Tingnan lahat ng review",
  "reviews.backToListing": "Bumalik sa listing",
  "reviews.subtitle": "Feedback ng mga tenant para sa {name}.",
  "reviews.subtitleFallback": "apartment na ito",
  "reviews.locked": "Magbubukas ang reviews pagkatapos ng 3 buwan na pagtira.",
  "reviews.write": "Mag-review",
  "reviews.edit": "I-edit ang Review",
  "reviews.retry": "Subukan ulit",
  "reviews.loading": "Naglo-load ng ratings…",
  "reviews.loadingDetails": "Naglo-load ng detalye ng apartment…",
  "reviews.detailsError": "Hindi ma-load ang detalye ng apartment na ito.",

  "reviews.count": "{count} review",
  "reviews.countPlural": "{count} review",
  "reviews.basedOn": "Base sa {count} review",
  "reviews.basedOnPlural": "Base sa {count} review",
  "reviews.meterAria": "{stars} star: {count} sa {total} review",
  "reviews.meterAriaPlural": "{stars} stars: {count} sa {total} review",
  "reviews.summaryAria": "Detalye ng apartment at summary ng rating",

  "reviews.sort.mostRecent": "Pinakabago",
  "reviews.sort.highest": "Pinakamataas na Rating",
  "reviews.sort.lowest": "Pinakamababang Rating",
  "reviews.sortAria": "I-sort ang reviews: {sort}",
  "reviews.sortMenuAria": "I-sort ang reviews",

  "reviews.noneTitle": "Wala pang rating",
  "reviews.noneBody":
    "Lalabas ang ratings pagkatapos i-review ng mga tenant ang apartment na ito.",
  "reviews.emptyTitle":
    "Wala pang review. Ikaw ang unang mag-share ng experience mo!",
  "reviews.emptyBody":
    "Malaking tulong ang review mo para makahanap ng tirahan ang ibang tenant.",
  "reviews.previewEmptyTitle": "Wala pang review",
  "reviews.previewEmptyBody":
    "Wala pang natanggap na review ang apartment na ito. Ikaw ang unang mag-share ng experience mo pagkatapos mong tumira.",
  "reviews.more": "at {count} pang review",
  "reviews.morePlural": "at {count} pang review",

  "reviews.listing.landlord": "Landlord",
  "reviews.listing.type": "Uri",
  "reviews.listing.view": "Tingnan ang listing",

  "reviews.card.readMore": "Basahin lahat",
  "reviews.card.showLess": "Bawasan",
  "reviews.card.photoAria": "Tingnan ang photo ng review {index}",
  "reviews.card.photoAlt": "Photo ng review {index}",
};
