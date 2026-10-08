import { renderHook, waitFor } from '@testing-library/react-native';

import {
  resolveApplicationDocumentUrls,
  resolvePrivateMediaUrls,
} from '@/service/media/privateMediaResolver';

import { useDocumentUrls } from './useDocumentUrls';

jest.mock('@/service/media/privateMediaResolver', () => ({
  resolvePrivateMediaUrls: jest.fn(),
  resolveApplicationDocumentUrls: jest.fn(),
}));

const mockResolvePrivateMediaUrls = jest.mocked(resolvePrivateMediaUrls);
const mockResolveApplicationDocumentUrls = jest.mocked(resolveApplicationDocumentUrls);

type DocumentEntriesProps = {
  entries: { label: string; path: string | null }[];
};

describe('useDocumentUrls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const resolution = {
      urls: { 'tenant/government-id.jpg': 'https://signed.example.test/government-id.jpg' },
      error: null,
    };
    mockResolvePrivateMediaUrls.mockResolvedValue(resolution);
    mockResolveApplicationDocumentUrls.mockResolvedValue(resolution);
  });

  it('does not resolve again when a parent recreates equivalent document entries', async () => {
    const documents = [{ label: 'Government ID', path: 'tenant/government-id.jpg' }];
    const { result, rerender } = renderHook<
      ReturnType<typeof useDocumentUrls>,
      DocumentEntriesProps
    >(
      ({ entries }) => useDocumentUrls(entries),
      { initialProps: { entries: documents } }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    rerender({ entries: [{ label: 'Government ID', path: 'tenant/government-id.jpg' }] });

    await waitFor(() => expect(result.current.resolved).toEqual([
      {
        label: 'Government ID',
        path: 'tenant/government-id.jpg',
        signedUrl: 'https://signed.example.test/government-id.jpg',
      },
    ]));
    expect(mockResolveApplicationDocumentUrls).toHaveBeenCalledTimes(1);
  });

  it('does not flip loading again once the first pass has resolved', async () => {
    const documents = [{ label: 'Government ID', path: 'tenant/government-id.jpg' }];
    const { result, rerender } = renderHook<
      ReturnType<typeof useDocumentUrls>,
      DocumentEntriesProps
    >(
      ({ entries }) => useDocumentUrls(entries),
      { initialProps: { entries: documents } },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    rerender({
      entries: [
        { label: 'Government ID', path: 'tenant/government-id.jpg' },
        { label: 'NBI Clearance', path: 'tenant/nbi.jpg' },
      ],
    });

    // Second pass must not blank the already-rendered content.
    expect(result.current.loading).toBe(false);
  });

  it('resolves through the requested private bucket', async () => {
    const documents = [{ label: 'Selfie', path: 'user-1/verification-1/selfie.jpg' }];
    const { result } = renderHook(() => useDocumentUrls(documents, 'user-verification'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockResolvePrivateMediaUrls).toHaveBeenCalledWith('user-verification', [
      'user-1/verification-1/selfie.jpg',
    ]);
  });
});
