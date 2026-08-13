import { renderHook, waitFor } from '@testing-library/react-native';

import { resolvePrivateMediaUrls } from '@/service/privateMediaResolver';

import { useDocumentUrls } from './useDocumentUrls';

jest.mock('@/service/privateMediaResolver', () => ({
  resolvePrivateMediaUrls: jest.fn(),
}));

const mockResolvePrivateMediaUrls = jest.mocked(resolvePrivateMediaUrls);

type DocumentEntriesProps = {
  entries: { label: string; path: string | null }[];
};

describe('useDocumentUrls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResolvePrivateMediaUrls.mockResolvedValue({
      urls: { 'tenant/government-id.jpg': 'https://signed.example.test/government-id.jpg' },
      error: null,
    });
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
    expect(mockResolvePrivateMediaUrls).toHaveBeenCalledTimes(1);
  });
});
