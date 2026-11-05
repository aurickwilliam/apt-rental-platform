import { Image } from 'react-native';

const mockCompressImage = jest.fn();

jest.mock('react-native', () => ({
  Image: {
    getSize: jest.fn(),
  },
}));

jest.mock('@/utils/compressImage', () => ({
  compressImage: (...args: unknown[]) => mockCompressImage(...args),
}));

jest.mock('@repo/supabase', () => ({
  supabase: {
    from: jest.fn(),
    storage: { from: jest.fn() },
    rpc: jest.fn(),
  },
}));

jest.mock('expo-file-system', () => ({
  File: class {},
}));

jest.mock('emoji-regex-xs', () => jest.fn(() => /$/));

jest.mock('../media/privateMediaResolver', () => ({
  PRIVATE_MEDIA_SIGNED_URL_TTL_SECONDS: 600,
  resolvePrivateMediaUrls: jest.fn(async () => ({ urls: {} })),
}));

// compressChatImageAsset is exported for tests; the heavy service import
// chain (supabase, storage) is stubbed above.
import { compressChatImageAsset } from './chatService';

const imageAsset = {
  localUri: 'file:///tmp/photo.jpg',
  mimeType: 'image/png',
};

beforeEach(() => {
  jest.clearAllMocks();
  (Image.getSize as jest.Mock).mockImplementation(
    (_uri: string, onSuccess: (w: number, h: number) => void) =>
      onSuccess(4000, 3000),
  );
  mockCompressImage.mockResolvedValue({
    uri: 'file:///tmp/compressed.jpg',
    width: 1600,
    height: 1200,
  });
});

describe('compressChatImageAsset', () => {
  it('compresses an image pick for upload', async () => {
    const prepared = await compressChatImageAsset(imageAsset);
    expect(mockCompressImage).toHaveBeenCalledWith(
      'file:///tmp/photo.jpg',
      4000,
      3000,
    );
    expect(prepared.localUri).toBe('file:///tmp/compressed.jpg');
    expect(prepared.mimeType).toBe('image/jpeg');
  });

  it('passes video assets through untouched', async () => {
    const asset = { localUri: 'file:///tmp/clip.mp4', mimeType: 'video/mp4' };
    const prepared = await compressChatImageAsset(asset);
    expect(prepared).toBe(asset);
    expect(mockCompressImage).not.toHaveBeenCalled();
  });

  it('passes gif assets through untouched', async () => {
    const asset = { localUri: 'file:///tmp/anim.gif', mimeType: 'image/gif' };
    const prepared = await compressChatImageAsset(asset);
    expect(prepared).toBe(asset);
    expect(mockCompressImage).not.toHaveBeenCalled();
  });

  it('passes external URL assets through untouched', async () => {
    const asset = {
      localUri: 'https://giphy.example/a.gif',
      mimeType: 'image/png',
      externalUrl: 'https://giphy.example/a.gif',
    };
    const prepared = await compressChatImageAsset(asset);
    expect(prepared).toBe(asset);
    expect(mockCompressImage).not.toHaveBeenCalled();
  });

  it('falls back to the original when dimensions cannot be read', async () => {
    (Image.getSize as jest.Mock).mockImplementation(
      (_uri: string, _onSuccess: unknown, onError: () => void) => onError(),
    );
    const prepared = await compressChatImageAsset(imageAsset);
    expect(prepared).toEqual(imageAsset);
    expect(mockCompressImage).not.toHaveBeenCalled();
  });
});
