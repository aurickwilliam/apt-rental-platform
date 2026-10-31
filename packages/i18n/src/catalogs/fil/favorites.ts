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
};
