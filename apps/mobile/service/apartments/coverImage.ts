// Apartment photo rows as selected from `apartment_images` (public CDN URLs).
export interface ApartmentImageRow {
  url: string;
  url_thumb: string | null;
  is_cover: boolean | null;
  created_at: string | null;
}

// The landlord's cover photo, else the earliest upload.
export function pickCoverImage(images: ApartmentImageRow[] | null | undefined): ApartmentImageRow | null {
  if (!images || images.length === 0) return null;

  return (
    images.find((image) => image.is_cover) ??
    [...images].sort(
      (a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime(),
    )[0]
  );
}

// A listing's photos with the cover first, the rest in their given order. A
// gallery's first photo is its hero, and the listing cards show the cover, so
// the two must agree; the query's own row order is not guaranteed.
export function orderCoverFirst<T extends { is_cover: boolean | null }>(
  images: readonly T[] | null | undefined,
): T[] {
  if (!images) return [];
  return [...images.filter((image) => image.is_cover), ...images.filter((image) => !image.is_cover)];
}

// Small version for list rows and cards; full size for heroes.
export function coverImageUrl(
  images: ApartmentImageRow[] | null | undefined,
  size: 'thumb' | 'full',
): string | null {
  const image = pickCoverImage(images);
  if (!image) return null;
  return size === 'thumb' ? image.url_thumb || image.url : image.url;
}
