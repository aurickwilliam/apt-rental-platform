import { getBrowserResourceCache, type BrowserResourceKey } from "./browser-resource-cache";
import type { FavoriteApartment } from "../service/favoritesService";

export interface FavoritePresentationScope { authUserId: string; profileId: string }
export interface FavoriteCursor { createdAt: string | null; apartmentId: string }
export interface FavoritePresentation {
  apartments: FavoriteApartment[];
  nextCursor: FavoriteCursor | null;
}

export const FAVORITES_PRESENTATION_LIMIT = 50;
const RESOURCE = "favorites-presentation";

export function favoritePresentationKey(scope: FavoritePresentationScope, cursor: FavoriteCursor | null): BrowserResourceKey {
  return { ...scope, portal: "tenant", resource: RESOURCE, params: ["created_at:desc,apartment_id:asc", FAVORITES_PRESENTATION_LIMIT, cursor?.createdAt ?? null, cursor?.apartmentId ?? null] };
}

/** All favorite write paths invalidate the pilot, including Browse's hearts. */
export function invalidateFavoritePresentation(profileId: string, removedApartmentId?: string): void {
  getBrowserResourceCache()?.invalidate<FavoritePresentation>(
    (key) => key.profileId === profileId && key.portal === "tenant" && key.resource === RESOURCE,
    removedApartmentId ? (page) => ({ ...page, apartments: page.apartments.filter((row) => row.id !== removedApartmentId) }) : undefined,
  );
}
