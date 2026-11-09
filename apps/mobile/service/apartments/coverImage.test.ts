import { coverImageUrl, orderCoverFirst, pickCoverImage, type ApartmentImageRow } from './coverImage';

const image = (overrides: Partial<ApartmentImageRow>): ApartmentImageRow => ({
  url: 'https://cdn.example/full.jpg',
  url_thumb: 'https://cdn.example/thumb.jpg',
  is_cover: false,
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('pickCoverImage', () => {
  it('prefers the cover photo', () => {
    const cover = image({ url: 'cover', is_cover: true, created_at: '2026-03-01T00:00:00Z' });
    expect(pickCoverImage([image({ url: 'first' }), cover])).toBe(cover);
  });

  it('falls back to the earliest upload', () => {
    const earliest = image({ url: 'earliest', created_at: '2025-12-01T00:00:00Z' });
    expect(pickCoverImage([image({ url: 'later' }), earliest])).toBe(earliest);
  });

  it('returns null without photos', () => {
    expect(pickCoverImage([])).toBeNull();
    expect(pickCoverImage(null)).toBeNull();
  });
});

describe('orderCoverFirst', () => {
  it('puts the cover first and keeps the other photos in their given order', () => {
    const first = image({ url: 'first' });
    const second = image({ url: 'second' });
    const cover = image({ url: 'cover', is_cover: true });
    expect(orderCoverFirst([first, second, cover]).map((photo) => photo.url)).toEqual(['cover', 'first', 'second']);
  });

  it('keeps the given order when the cover is already first or missing', () => {
    const a = image({ url: 'a', is_cover: true });
    const b = image({ url: 'b' });
    expect(orderCoverFirst([a, b])).toEqual([a, b]);
    expect(orderCoverFirst([b, image({ url: 'c' })]).map((photo) => photo.url)).toEqual(['b', 'c']);
  });

  it('treats a null is_cover as not the cover and never mutates its input', () => {
    const input = [image({ url: 'x', is_cover: null }), image({ url: 'y', is_cover: true })];
    const copy = [...input];
    expect(orderCoverFirst(input).map((photo) => photo.url)).toEqual(['y', 'x']);
    expect(input).toEqual(copy);
  });

  it('returns an empty list without photos', () => {
    expect(orderCoverFirst([])).toEqual([]);
    expect(orderCoverFirst(null)).toEqual([]);
    expect(orderCoverFirst(undefined)).toEqual([]);
  });
});

describe('coverImageUrl', () => {
  it('uses the thumbnail for small sizes and the full image for heroes', () => {
    const images = [image({ is_cover: true })];
    expect(coverImageUrl(images, 'thumb')).toBe('https://cdn.example/thumb.jpg');
    expect(coverImageUrl(images, 'full')).toBe('https://cdn.example/full.jpg');
  });

  it('falls back to the full image when there is no thumbnail', () => {
    expect(coverImageUrl([image({ url_thumb: null })], 'thumb')).toBe('https://cdn.example/full.jpg');
  });
});
