import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { createElement, type ReactNode } from 'react';
import fc from 'fast-check';

import { clearPrivateMediaUrlCache } from '@/service/privateMediaResolver';
import { createMobileQueryClient } from '@/utils/queryClient';

const CURRENT_USER_ID = 'user-internal-1';
const OTHER_USER_ID = 'user-internal-2';
const APARTMENT_ID = 'apartment-1';
const TENANCY_ID = 'tenancy-1';

type ChatRow = {
  id: string;
  message: string | null;
  message_type: 'text' | 'image';
  attachment_path: string | null;
  attachment_mime_type: string | null;
  attachment_thumbnail_path: string | null;
  group_id: string | null;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  apartment_id: string | null;
};

let mockChatRows: ChatRow[] = [];
const mockGetUser = jest.fn();
const mockCreateSignedUrls = jest.fn();
const mockStorageFrom = jest.fn();
const mockFrom = jest.fn();
const mockRemoveChannel = jest.fn();
const mockTenancyCallbacks: Array<(payload: { new?: unknown; old?: unknown }) => Promise<void>> = [];
const mockChannel = jest.fn();

const profileRecord = {
  id: CURRENT_USER_ID,
  user_id: 'auth-user-1',
  first_name: 'Current',
  last_name: 'User',
  middle_name: null,
  email: 'current@example.test',
  mobile_number: null,
  avatar_url: null,
  account_status: 'active',
  background_url: null,
  role: 'tenant',
  gender: null,
  birth_date: null,
  street_address: null,
  barangay: null,
  city: null,
  province: null,
  postal_code: null,
};

function createUserQuery() {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.single.mockResolvedValue({ data: profileRecord, error: null });

  return query;
}

function createChatQuery() {
  let pageLimit = mockChatRows.length;
  const query: {
    select: jest.Mock;
    or: jest.Mock;
    order: jest.Mock;
    eq: jest.Mock;
    is: jest.Mock;
    limit: jest.Mock;
    then: PromiseLike<{ data: ChatRow[]; error: null }>['then'];
  } = {
    select: jest.fn(),
    or: jest.fn(),
    order: jest.fn(),
    eq: jest.fn(),
    is: jest.fn(),
    limit: jest.fn(),
    then: (resolve, reject) =>
      Promise.resolve({ data: mockChatRows.slice(0, pageLimit), error: null }).then(resolve, reject),
  };

  query.select.mockReturnValue(query);
  query.or.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.is.mockReturnValue(query);
  query.limit.mockImplementation((limit: number) => {
    pageLimit = limit;
    return query;
  });

  return query;
}

function createTenancyQuery() {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    maybeSingle: jest.fn(),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.maybeSingle.mockResolvedValue({
    data: {
      id: TENANCY_ID,
      lease_start: '2026-01-01',
      lease_end: null,
      monthly_rent: 12000,
      status: 'active',
      apartment: { id: APARTMENT_ID, name: 'Fixture apartment' },
      landlord: null,
    },
    error: null,
  });

  return query;
}

function createPaymentQuery() {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    maybeSingle: jest.fn(),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  query.maybeSingle.mockResolvedValue({ data: null, error: null });

  return query;
}

mockGetUser.mockResolvedValue({ data: { user: { id: 'auth-user-1' } } });
mockStorageFrom.mockReturnValue({ createSignedUrls: mockCreateSignedUrls });
mockCreateSignedUrls.mockImplementation(async (paths: string[]) => ({
  data: paths.map((path) => ({ path, signedUrl: `https://signed.example.test/${path}`, error: null })),
  error: null,
}));
mockFrom.mockImplementation((table: string) => {
  if (table === 'users') return createUserQuery();
  if (table === 'chat') return createChatQuery();
  if (table === 'tenancies') return createTenancyQuery();
  if (table === 'payment') return createPaymentQuery();
  throw new Error(`Unexpected table ${table}`);
});
mockChannel.mockImplementation(() => {
  const channel = {
    on: jest.fn(),
    subscribe: jest.fn(),
  };

  channel.on.mockImplementation(
    (_event: string, filter: { table?: string }, callback: (payload: { new?: unknown; old?: unknown }) => Promise<void>) => {
      if (filter.table === 'tenancies') mockTenancyCallbacks.push(callback);
      return channel;
    }
  );
  channel.subscribe.mockReturnValue(channel);

  return channel;
});

jest.mock('@repo/supabase', () => ({
  supabase: {
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    from: (...args: unknown[]) => mockFrom(...args),
    storage: { from: (...args: unknown[]) => mockStorageFrom(...args) },
    channel: (...args: unknown[]) => mockChannel(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
  },
}));

jest.mock('expo-file-system', () => ({
  File: class {},
}));

jest.mock('expo-router', () => {
  const React = require('react');

  return {
    useFocusEffect: (effect: () => void | (() => void)) => React.useEffect(effect, [effect]),
  };
});

import {
  fetchMessages,
  getChatAttachmentSignedUrls,
  mapMessages,
} from '@/service/chatService';
import { getCurrentUser } from '@/service/currentUserService';
import { useProfile } from '@/hooks/auth/useProfile';
import { useTenancy } from '@/hooks/tenancy/useTenancy';

function createMessageRows(length: number, includeAttachments = false): ChatRow[] {
  return Array.from({ length }, (_, index) => ({
    id: `message-${index.toString().padStart(3, '0')}`,
    message: includeAttachments ? null : `Message ${index}`,
    message_type: includeAttachments ? 'image' : 'text',
    attachment_path: includeAttachments ? `attachments/${index % 3}.jpg` : null,
    attachment_mime_type: includeAttachments ? 'image/jpeg' : null,
    attachment_thumbnail_path: includeAttachments ? `thumbnails/${index % 2}.jpg` : null,
    group_id: null,
    created_at: new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString(),
    sender_id: index % 2 === 0 ? CURRENT_USER_ID : OTHER_USER_ID,
    receiver_id: index % 2 === 0 ? OTHER_USER_ID : CURRENT_USER_ID,
    apartment_id: APARTMENT_ID,
  }));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockChatRows = [];
  mockTenancyCallbacks.length = 0;
  clearPrivateMediaUrlCache();
  mockGetUser.mockResolvedValue({ data: { user: { id: 'auth-user-1' } } });
  mockCreateSignedUrls.mockImplementation(async (paths: string[]) => ({
    data: paths.map((path) => ({ path, signedUrl: `https://signed.example.test/${path}`, error: null })),
    error: null,
  }));
});

describe('audit-fix bug-condition characterization (unfixed flow)', () => {
  /** Validates: Requirements 1.1, 1.2, 2.1, 2.2 */
  test.failing('Property 1: concurrent equivalent identity reads coalesce to one auth/profile sequence', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 2, max: 4 }), async (consumerCount) => {
        mockGetUser.mockClear();

        await Promise.all(
          Array.from({ length: consumerCount }, () => getCurrentUser())
        );

        expect(mockGetUser).toHaveBeenCalledTimes(1);
      }),
      { numRuns: 10 }
    );
  });

  /** Validates: Requirements 1.4, 2.4 */
  test('a 200-message conversation has an initial page bounded to 30 rows', async () => {
    mockChatRows = createMessageRows(200, true);

    const messages = await fetchMessages(CURRENT_USER_ID, OTHER_USER_ID, APARTMENT_ID);

    expect(messages).toHaveLength(30);
  });

  /** Validates: Requirements 1.4, 2.4 */
  test('Property 2: every generated initial conversation is page-bounded', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 31, max: 250 }), async (rowCount) => {
        mockChatRows = createMessageRows(rowCount);

        const messages = await fetchMessages(CURRENT_USER_ID, OTHER_USER_ID, APARTMENT_ID);

        expect(messages.length).toBeLessThanOrEqual(30);
      }),
      { numRuns: 10 }
    );
  });

  /** Validates: Requirements 1.3, 1.10, 2.3, 2.10 */
  test('Property 3: signing batches contain only unique missing storage paths', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: 0, max: 3 }), { minLength: 2, maxLength: 20 }),
        async (pathIndexes) => {
          clearPrivateMediaUrlCache();
          const paths = pathIndexes.map((index) => `attachments/${index}.jpg`);
          mockCreateSignedUrls.mockClear();

          await getChatAttachmentSignedUrls(paths);

          const requestedPaths = mockCreateSignedUrls.mock.calls[0]?.[0] as string[];
          expect(requestedPaths.length).toBe(new Set(requestedPaths).size);
        }
      ),
      { numRuns: 10 }
    );
  });

  /** Validates: Requirements 1.8, 2.8 */
  test.failing('Property 4: an unrelated tenancy realtime event does not refetch the active tenancy', async () => {
    const { result } = renderHook(() => useTenancy());

    await waitFor(() => expect(result.current.tenancy?.id).toBe(TENANCY_ID));
    const fetchesBeforeUnrelatedEvent = mockGetUser.mock.calls.length;
    const onTenancyChange = mockTenancyCallbacks.at(-1);

    expect(onTenancyChange).toBeDefined();

    await act(async () => {
      await onTenancyChange?.({ new: { id: 'unrelated-tenancy' } });
    });

    expect(mockGetUser).toHaveBeenCalledTimes(fetchesBeforeUnrelatedEvent);
  });
});

describe('audit-fix preservation characterization (unfixed flow)', () => {
  it('manual profile refetch performs a fresh authorized identity read', async () => {
    const queryClient = createMobileQueryClient();
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);
    const { result, unmount } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.profile?.id).toBe(CURRENT_USER_ID);

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockGetUser).toHaveBeenCalledTimes(2);
    expect(result.current.profile?.id).toBe(CURRENT_USER_ID);
    unmount();
    queryClient.clear();
  });

  /** Validates: Requirements 3.4, 3.9, 3.12 */
  it('Property 6: generated private-media records retain their stored paths, order, and resolved access URLs', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.uuid(), { minLength: 1, maxLength: 20 }),
        async (ids) => {
          const rows = ids.map((id, index) => ({
            ...createMessageRows(1, true)[0],
            id,
            attachment_path: `attachments/${id}.jpg`,
            attachment_thumbnail_path: index % 2 === 0 ? `thumbnails/${id}.jpg` : null,
          }));

          const messages = await mapMessages(rows, CURRENT_USER_ID);

          expect(messages.map((message) => message.id)).toEqual(ids);
          expect(messages.map((message) => message.attachmentPath)).toEqual(
            rows.map((row) => row.attachment_path)
          );
          expect(messages.every((message) => message.attachmentUrl?.startsWith('https://signed.example.test/'))).toBe(true);
        }
      ),
      { numRuns: 10 }
    );
  });

  it('returns a time-limited URL for an authorized private chat path', async () => {
    const result = await getChatAttachmentSignedUrls(['attachments/authorized.jpg']);

    expect(result).toEqual({
      'attachments/authorized.jpg': 'https://signed.example.test/attachments/authorized.jpg',
    });
    expect(mockCreateSignedUrls).toHaveBeenCalledWith(['attachments/authorized.jpg'], 60 * 60);
  });
});
