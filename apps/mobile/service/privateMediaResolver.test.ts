import fc from 'fast-check';

const mockCreateSignedUrls = jest.fn();
const mockStorageFrom = jest.fn((_bucket: string) => ({ createSignedUrls: mockCreateSignedUrls }));

jest.mock('@repo/supabase', () => ({
  supabase: {
    storage: { from: (bucket: string) => mockStorageFrom(bucket) },
  },
}));

import {
  CHAT_VISIBLE_MEDIA_REFRESH_AGE_MS,
  PRIVATE_MEDIA_CACHE_TTL_MS,
  clearPrivateMediaUrlCache,
  refreshVisibleChatMediaUrls,
  resolvePrivateMediaUrls,
  retryChatMediaUrlOnce,
  setPrivateMediaCacheUser,
} from './privateMediaResolver';

const BASE_TIME = Date.UTC(2026, 0, 1);

function mockSuccessfulSigning(): void {
  mockCreateSignedUrls.mockImplementation(async (paths: string[]) => ({
    data: paths.map((path) => ({
      path,
      signedUrl: `https://signed.example.test/${path}`,
      error: null,
    })),
    error: null,
  }));
}

describe('privateMediaResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearPrivateMediaUrlCache();
    jest.spyOn(Date, 'now').mockReturnValue(BASE_TIME);
    mockSuccessfulSigning();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /** Validates: Requirements 2.3, 2.10, 2.11 */
  it('Property 3: signs only unique paths in each cache-miss batch', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 0, max: 4 }), { minLength: 1, maxLength: 20 }),
        async (indexes) => {
          clearPrivateMediaUrlCache();
          mockCreateSignedUrls.mockClear();
          const paths = indexes.map((index) => `tenant/${index}.jpg`);

          await resolvePrivateMediaUrls('chat-images', paths);

          const requestedPaths = mockCreateSignedUrls.mock.calls[0]?.[0] as string[];
          expect(requestedPaths).toEqual([...new Set(paths)]);
        }
      ),
      { numRuns: 20 }
    );
  });

  it('isolates cache entries by bucket and preserves input storage paths', async () => {
    const path = 'shared/media.jpg';

    const chat = await resolvePrivateMediaUrls('chat-images', [path]);
    const documents = await resolvePrivateMediaUrls('application-documents', [path]);

    expect(chat.urls[path]).toBe(`https://signed.example.test/${path}`);
    expect(documents.urls[path]).toBe(`https://signed.example.test/${path}`);
    expect(mockStorageFrom).toHaveBeenNthCalledWith(1, 'chat-images');
    expect(mockStorageFrom).toHaveBeenNthCalledWith(2, 'application-documents');
    expect(mockCreateSignedUrls).toHaveBeenCalledTimes(2);
  });

  it('reuses a valid cached URL and re-signs exactly at the 55-minute boundary', async () => {
    const path = 'tenant/photo.jpg';
    await resolvePrivateMediaUrls('maintenance-images', [path]);

    jest.spyOn(Date, 'now').mockReturnValue(BASE_TIME + PRIVATE_MEDIA_CACHE_TTL_MS - 1);
    await resolvePrivateMediaUrls('maintenance-images', [path]);
    expect(mockCreateSignedUrls).toHaveBeenCalledTimes(1);

    jest.spyOn(Date, 'now').mockReturnValue(BASE_TIME + PRIVATE_MEDIA_CACHE_TTL_MS);
    await resolvePrivateMediaUrls('maintenance-images', [path]);
    expect(mockCreateSignedUrls).toHaveBeenCalledTimes(2);
  });

  it('clears cached URLs for an explicit clear and current-user change', async () => {
    const path = 'tenant/document.pdf';
    setPrivateMediaCacheUser('auth-user-1');
    await resolvePrivateMediaUrls('application-documents', [path]);
    await resolvePrivateMediaUrls('application-documents', [path]);
    expect(mockCreateSignedUrls).toHaveBeenCalledTimes(1);

    setPrivateMediaCacheUser('auth-user-2');
    await resolvePrivateMediaUrls('application-documents', [path]);
    clearPrivateMediaUrlCache();
    await resolvePrivateMediaUrls('application-documents', [path]);
    expect(mockCreateSignedUrls).toHaveBeenCalledTimes(3);
  });

  it('returns null values and a generic error when signing fails', async () => {
    mockCreateSignedUrls.mockResolvedValue({ data: null, error: new Error('forbidden') });

    const result = await resolvePrivateMediaUrls('chat-images', ['tenant/private.jpg']);

    expect(result).toEqual({
      urls: { 'tenant/private.jpg': null },
      error: 'Unable to access private media.',
    });
  });

  it('does not cache an in-flight signing result after the active account changes', async () => {
    const path = 'tenant/private.jpg';
    setPrivateMediaCacheUser('auth-user-a');

    let finishSigning: ((value: {
      data: Array<{ path: string; signedUrl: string; error: null }>;
      error: null;
    }) => void) | undefined;
    mockCreateSignedUrls
      .mockImplementationOnce(
        () => new Promise((resolve) => {
          finishSigning = resolve;
        })
      )
      .mockResolvedValueOnce({
        data: [{ path, signedUrl: 'https://signed.example.test/account-b.jpg', error: null }],
        error: null,
      });

    const originalRequest = resolvePrivateMediaUrls('chat-images', [path]);
    setPrivateMediaCacheUser('auth-user-b');
    finishSigning?.({
      data: [{ path, signedUrl: 'https://signed.example.test/account-a.jpg', error: null }],
      error: null,
    });

    expect((await originalRequest).urls[path]).toBe('https://signed.example.test/account-a.jpg');

    const accountBRequest = await resolvePrivateMediaUrls('chat-images', [path]);
    expect(accountBRequest.urls[path]).toBe('https://signed.example.test/account-b.jpg');
    expect(mockCreateSignedUrls).toHaveBeenCalledTimes(2);
  });

  it('refreshes visible chat media once after 45 minutes and retries a load error once', async () => {
    const path = 'sender/attachment.jpg';
    await resolvePrivateMediaUrls('chat-images', [path]);

    jest.spyOn(Date, 'now').mockReturnValue(BASE_TIME + CHAT_VISIBLE_MEDIA_REFRESH_AGE_MS - 1);
    await refreshVisibleChatMediaUrls([path]);
    expect(mockCreateSignedUrls).toHaveBeenCalledTimes(1);

    jest.spyOn(Date, 'now').mockReturnValue(BASE_TIME + CHAT_VISIBLE_MEDIA_REFRESH_AGE_MS);
    await refreshVisibleChatMediaUrls([path]);
    await refreshVisibleChatMediaUrls([path]);
    expect(mockCreateSignedUrls).toHaveBeenCalledTimes(2);

    const firstRetry = await retryChatMediaUrlOnce('message-1', 'attachment', path);
    const secondRetry = await retryChatMediaUrlOnce('message-1', 'attachment', path);
    expect(firstRetry.didRetry).toBe(true);
    expect(secondRetry.didRetry).toBe(false);
    expect(mockCreateSignedUrls).toHaveBeenCalledTimes(3);
  });
});
