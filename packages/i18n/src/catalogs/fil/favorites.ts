import type { favorites as enFavorites } from "../en/favorites";

export const favorites: Record<keyof typeof enFavorites, string> = {
  "favorites.saved": "Na-save sa favorites",
  "favorites.removed": "Tinanggal sa favorites",
  "favorites.tenantsOnly": "Mga tenant lang ang puwedeng mag-save ng favorites",
  "favorites.updateFailed": "Hindi ma-update ang favorites",
  "favorites.save.aria": "I-save sa favorites",
  "favorites.remove.aria": "Tanggalin sa favorites",
  "favorites.signInTitle": "Mag-sign in para mag-save ng favorites",
  "favorites.signInBody":
    "Gumawa ng account para ma-save ang mga apartment at ma-access anumang oras.",

  "favorites.title": "Favorites",
  "favorites.subtitle": "Itago sa isang lugar ang mga na-save mong apartment.",
  "favorites.refreshFailed":
    "Hindi na-refresh ang favorites mo. Ipinapakita ang huling na-load na listahan.",
  "favorites.tryAgain": "Subukan ulit",
  "favorites.refreshing": "Nagre-refresh ng favorites",
  "favorites.loadingSaved": "Naglo-load ng mga na-save na apartment…",
  "favorites.savedApartments": "Mga na-save na apartment",
  "favorites.count": "{count} na-save na apartment",
  "favorites.countPlural": "{count} na-save na apartment",
  "favorites.countPage": "{count} na-save na apartment sa page na ito",
  "favorites.countPagePlural": "{count} na-save na apartment sa page na ito",
  "favorites.viewGroupAria": "View ng favorites",
  "favorites.gridView": "Grid view",
  "favorites.listView": "List view",
  "favorites.browse": "Mag-browse ng apartment",
  "favorites.loadTitle": "Hindi ma-load ang favorites mo",
  "favorites.emptyPageTitle": "Walang available na na-save na apartment sa page na ito",
  "favorites.emptyTitle": "Dito nagsisimula ang shortlist mo",
  "favorites.emptyPageBody":
    "May mga na-save na listing na hindi na available. Subukan ang ibang page o mag-browse pa ng apartment.",
  "favorites.emptyBody":
    "Pindutin ang heart sa apartment para ma-save dito at balikan kung kailan mo gusto.",
  "favorites.pagesAria": "Mga page ng favorites",
  "favorites.previous": "Previous",
  "favorites.next": "Next",
  "favorites.page": "Page {count}",

  "favorites.card.bedroom": "{count} bedroom",
  "favorites.card.bedroomPlural": "{count} bedrooms",
  "favorites.card.bathroom": "{count} bathroom",
  "favorites.card.bathroomPlural": "{count} bathrooms",
  "favorites.card.sqm": "{count} sqm",
  "favorites.card.perMonth": "/ month",
  "favorites.card.noRatings": "Wala pang rating",

  "favorites.skeleton.loading": "Naglo-load ng mga na-save na apartment",
  "favorites.skeleton.toolbar": "Naglo-load ng favorites toolbar",
};
