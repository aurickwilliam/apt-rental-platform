import { fetchConversationsWithMetadata } from './conversationService';

import type { Conversation } from './chatService';

const MY_ID = 'my-user';

const mockRpc = jest.fn();
const mockFrom = jest.fn();

jest.mock('@repo/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

jest.mock('expo-file-system', () => ({
  File: class {},
}));

/** Chainable query builder where awaiting any node resolves the same payload. */
function createQuery(final: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q: any = {
    select: jest.fn(() => q),
    eq: jest.fn(() => q),
    or: jest.fn(() => q),
    order: jest.fn(() => q),
    then(resolve: (value: unknown) => void) {
      resolve({ data: final, error: null });
    },
  };
  return q as { select: jest.Mock; eq: jest.Mock; or: jest.Mock; order: jest.Mock };
}

const seedV2Conversations: Conversation[] = [
  {
    conversation_key: 'chat:apt-1:my-user:other-1',
    other_user_id: 'other-1',
    other_user_name: 'Other One',
    other_user_avatar: null,
    other_user_phone: null,
    apartment_id: 'apt-1',
    apartment_name: 'APT Homes',
    last_message: 'check the video',
    last_message_type: 'video',
    last_message_time: '2026-01-01T00:02:00Z',
    unread_count: 1,
    last_sender_id: 'other-1',
    conversation_type: 'tenant',
  },
  {
    conversation_key: 'chat:apt-2:my-user:other-2',
    other_user_id: 'other-2',
    other_user_name: 'Other Two',
    other_user_avatar: null,
    other_user_phone: null,
    apartment_id: 'apt-2',
    apartment_name: 'APT Loft',
    last_message: null,
    last_message_type: 'gif',
    last_message_time: '2026-01-01T00:01:00Z',
    unread_count: 0,
    last_sender_id: MY_ID,
    conversation_type: 'inquiry',
  },
];

beforeEach(() => {
  mockRpc.mockReset();
  mockFrom.mockReset();
});

describe('fetchConversationsWithMetadata — v2 path', () => {
  it('calls get_conversations_v2 with no arguments and maps metadata from the RPC', async () => {
    mockRpc.mockResolvedValue({ data: seedV2Conversations, error: null });

    const result = await fetchConversationsWithMetadata(MY_ID, 'landlord');

    expect(mockRpc).toHaveBeenCalledTimes(1);
    expect(mockRpc).toHaveBeenCalledWith('get_conversations_v2');
  });

  it('does not scan chat or tenancies rows on the v2 path', async () => {
    mockRpc.mockResolvedValue({ data: seedV2Conversations, error: null });

    await fetchConversationsWithMetadata(MY_ID, 'landlord');

    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('maps last_sender_id to last_sender_is_me', async () => {
    mockRpc.mockResolvedValue({ data: seedV2Conversations, error: null });

    const result = await fetchConversationsWithMetadata(MY_ID, 'tenant');

    expect(result[0].last_sender_is_me).toBe(false);
    expect(result[1].last_sender_is_me).toBe(true);
  });

  it('preserves last_message_type and conversation_type from the RPC', async () => {
    mockRpc.mockResolvedValue({ data: seedV2Conversations, error: null });

    const result = await fetchConversationsWithMetadata(MY_ID, 'tenant');

    expect(result[0].last_message_type).toBe('video');
    expect(result[0].conversation_type).toBe('tenant');
    expect(result[1].last_message_type).toBe('gif');
    expect(result[1].conversation_type).toBe('inquiry');
    expect(result[1].unread_count).toBe(0);
    expect(result[0].unread_count).toBe(1);
  });

  it('keeps the deterministic last-message-time ordering from the RPC service', async () => {
    mockRpc.mockResolvedValue({ data: seedV2Conversations, error: null });

    const result = await fetchConversationsWithMetadata(MY_ID, 'tenant');

    expect(result.map((c) => c.conversation_key)).toEqual([
      seedV2Conversations[0].conversation_key,
      seedV2Conversations[1].conversation_key,
    ]);
  });
});

describe('fetchConversationsWithMetadata — legacy fallback', () => {
  const legacyError = {
    code: 'PGRST202',
    message: 'Could not find the function public.get_conversations_v2 in the schema cache',
  };

  const tenancyRows = [{ tenant_id: 'other-1', apartment_id: 'apt-1' }];
  const chatRows = [
    {
      sender_id: 'other-1',
      receiver_id: MY_ID,
      apartment_id: 'apt-1',
      message_type: 'image',
      created_at: '2026-01-01T00:02:00Z',
    },
    {
      sender_id: MY_ID,
      receiver_id: 'other-2',
      apartment_id: 'apt-2',
      message_type: 'text',
      created_at: '2026-01-01T00:01:00Z',
    },
  ];
  const legacyConversations: Conversation[] = [
    {
      conversation_key: 'legacy-key-1',
      other_user_id: 'other-1',
      other_user_name: 'Other One',
      other_user_avatar: null,
      other_user_phone: null,
      apartment_id: 'apt-1',
      apartment_name: 'APT Homes',
      last_message: 'hello',
      last_message_type: null,
      last_message_time: '2026-01-01T00:02:00Z',
      unread_count: 1,
      last_sender_id: null,
      conversation_type: 'inquiry',
    },
    {
      conversation_key: 'legacy-key-2',
      other_user_id: 'other-2',
      other_user_name: 'Other Two',
      other_user_avatar: null,
      other_user_phone: null,
      apartment_id: 'apt-2',
      apartment_name: 'APT Loft',
      last_message: 'hi',
      last_message_type: null,
      last_message_time: '2026-01-01T00:01:00Z',
      unread_count: 0,
      last_sender_id: null,
      conversation_type: 'inquiry',
    },
  ];

  function mockLegacyQueries() {
    mockFrom.mockImplementation((table: string) =>
      table === 'tenancies' ? createQuery(tenancyRows) : createQuery(chatRows)
    );
  }

  it('falls back to the legacy scan only for PGRST202 and stays backward compatible', async () => {
    // First call (v2) rejects; the fallback's second call (old RPC) succeeds.
    mockRpc.mockRejectedValueOnce(legacyError);
    mockRpc.mockResolvedValueOnce({ data: legacyConversations, error: null });
    mockLegacyQueries();

    const result = await fetchConversationsWithMetadata(MY_ID, 'landlord');

    const calledTables = mockFrom.mock.calls.map((call) => call[0]);
    expect(calledTables).toEqual(['tenancies', 'chat']);
    expect(result[0].last_sender_is_me).toBe(false);
    expect(result[0].last_message_type).toBe('image');
    expect(result[0].conversation_type).toBe('tenant');
    expect(result[1].last_sender_is_me).toBe(true);
    expect(result[1].conversation_type).toBe('inquiry');
  });

  it('skips the tenancies query on the legacy path for tenant role', async () => {
    mockRpc.mockRejectedValueOnce(legacyError);
    mockRpc.mockResolvedValueOnce({ data: legacyConversations, error: null });
    mockFrom.mockImplementation((table: string) => createQuery(chatRows));

    await fetchConversationsWithMetadata(MY_ID, 'tenant');

    expect(mockFrom).toHaveBeenCalledTimes(1);
    expect(mockFrom).toHaveBeenCalledWith('chat');
  });
});

describe('fetchConversationsWithMetadata — unexpected v2 errors', () => {
  it('rethrows permission errors instead of falling back', async () => {
    mockRpc.mockRejectedValue({ code: '42501', message: 'permission denied for function' });

    await expect(fetchConversationsWithMetadata(MY_ID, 'tenant')).rejects.toMatchObject({
      code: '42501',
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('rethrows unknown errors instead of falling back', async () => {
    mockRpc.mockRejectedValue({ message: 'boom' });

    await expect(fetchConversationsWithMetadata(MY_ID, 'tenant')).rejects.toMatchObject({
      message: 'boom',
    });
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
