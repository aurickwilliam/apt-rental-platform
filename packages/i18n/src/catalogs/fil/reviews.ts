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
  "reviews.meterAria": "{count} sa {total} review",
  "reviews.meterAriaPlural": "{count} sa {total} review",
  "reviews.starLabel": "{count} star",
  "reviews.starLabelPlural": "{count} stars",
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

  "reviews.form.title": "I-rate ang Apartment",
  "reviews.form.loading": "Naglo-load ng detalye ng review…",
  "reviews.form.loadFailed": "Hindi ma-load ang detalye ng review.",
  "reviews.form.goBack": "Bumalik",
  "reviews.form.signInToWrite":
    "Kailangan mong naka-sign in bilang tenant para makapag-review.",
  "reviews.form.signInToEdit":
    "Kailangan mong naka-sign in bilang tenant para ma-edit ang review.",
  "reviews.form.cannotEdit": "Hindi ma-edit ang review na ito.",
  "reviews.form.missingTenancy": "Walang reference ng tenancy.",
  "reviews.form.stayNotReviewable": "Hindi ma-review ang stay na ito.",
  "reviews.form.ratingRequired": "Pumili ng rating",
  "reviews.form.reviewRequired": "Magsulat ng review",
  "reviews.form.updated": "Na-update ang review!",
  "reviews.form.submitted": "Na-submit ang review!",
  "reviews.form.updateFailed":
    "Hindi na-save ang mga pagbabago. Subukan ulit.",
  "reviews.form.submitFailed": "Hindi na-submit ang review. Subukan ulit.",
  "reviews.form.landlord": "Landlord",
  "reviews.form.apartmentType": "Uri ng Apartment",
  "reviews.form.durationOfStay": "Tagal ng Pagtira",
  "reviews.form.ongoing": "Kasalukuyan",
  "reviews.form.overallRating": "Overall na Rating",
  "reviews.form.ratingPoor": "1 - Mahina",
  "reviews.form.ratingExcellent": "5 - Magaling",
  "reviews.form.tenantReview": "Review ng Tenant:",
  "reviews.form.placeholder":
    "Isulat ang experience at review mo tungkol sa apartment..",
  "reviews.form.saving": "Nagse-save…",
  "reviews.form.submitting": "Nagsu-submit…",
  "reviews.form.saveChanges": "I-save ang mga Pagbabago",
  "reviews.form.submit": "I-submit ang Review",
  "reviews.form.starAria": "I-rate ng {count} star",
  "reviews.form.starAriaPlural": "I-rate ng {count} stars",

  "reviews.photos.title": "Mga Photo (optional)",
  "reviews.photos.addOne": "Magdagdag ng photo",
  "reviews.photos.add": "Magdagdag ng mga photo",
  "reviews.photos.hint": "PNG, JPG hanggang {size}MB",
  "reviews.photos.removeAria": "Tanggalin ang photo",
  "reviews.photos.alt": "Photo ng review",
  "reviews.photos.notImage": "Hindi image ang {name}",
  "reviews.photos.tooLarge": "Lumampas ang {name} sa {size}MB na limit",
};
