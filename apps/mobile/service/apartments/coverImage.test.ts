import { coverImageUrl, pickCoverImage, type ApartmentImageRow } from './coverImage';

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
