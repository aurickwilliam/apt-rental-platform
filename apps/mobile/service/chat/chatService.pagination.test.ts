import fc from 'fast-check';

const mockFrom = jest.fn();
const mockStorageFrom = jest.fn();

type ChatRow = {
  id: string;
  message: string | null;
  message_type: 'text';
  attachment_path: null;
  attachment_mime_type: null;
  attachment_thumbnail_path: null;
  group_id: null;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  apartment_id: string;
};

type QueryLog = {
  order: jest.Mock;
  or: jest.Mock;
  limit: jest.Mock;
};

let pageResponses: ChatRow[][] = [];
let queryLogs: QueryLog[] = [];

function createChatQuery() {
  const query: QueryLog & {
    select: jest.Mock;
    eq: jest.Mock;
    is: jest.Mock;
    then: PromiseLike<{ data: ChatRow[]; error: null }>['then'];
  } = {
    select: jest.fn(),
    or: jest.fn(),
    order: jest.fn(),
    eq: jest.fn(),
    is: jest.fn(),
    limit: jest.fn(),
    then: (resolve, reject) =>
      Promise.resolve({ data: pageResponses.shift() ?? [], error: null }).then(resolve, reject),
  };

  query.select.mockReturnValue(query);
  query.or.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.is.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  queryLogs.push(query);

  return query;
}

mockFrom.mockImplementation((table: string) => {
  if (table !== 'chat') throw new Error(`Unexpected table ${table}`);
  return createChatQuery();
});
mockStorageFrom.mockReturnValue({ createSignedUrls: jest.fn() });

jest.mock('@repo/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    storage: { from: (...args: unknown[]) => mockStorageFrom(...args) },
  },
}));

jest.mock('expo-file-system', () => ({
  File: class {},
}));

import {
  CHAT_MESSAGES_PAGE_SIZE,
  fetchMessagePage,
  type Message,
} from './chatService';
import { mergeChatMessages } from './chatPagination';

const CURRENT_USER_ID = 'current-user';
const OTHER_USER_ID = 'other-user';
const APARTMENT_ID = 'apartment-id';

function createRows(ids: string[]): ChatRow[] {
  return ids.flatMap((id, index, source) => {
    const groupStart = Math.floor(index / 3) * 3;
    if (index !== groupStart) return [];

    const timestamp = new Date(Date.UTC(2026, 0, 1, 0, 0, 100 - groupStart / 3)).toISOString();
    return source
      .slice(groupStart, groupStart + 3)
      .sort((left, right) => right.localeCompare(left))
      .map((groupId) => ({
        id: groupId,
        message: `Message ${groupId}`,
        message_type: 'text' as const,
        attachment_path: null,
        attachment_mime_type: null,
        attachment_thumbnail_path: null,
        group_id: null,
        created_at: timestamp,
        sender_id: CURRENT_USER_ID,
        receiver_id: OTHER_USER_ID,
        apartment_id: APARTMENT_ID,
      }));
  });
}

function createMessage(id: string): Message {
  return {
    id,
    message: id,
    messageType: 'text',
    attachmentUrl: null,
    attachmentPath: null,
    timestamp: '10:00 AM',
    isSent: false,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  pageResponses = [];
  queryLogs = [];
});

describe('fetchMessagePage', () => {
  it('requests a 30-row newest-first first page with an ID tiebreaker', async () => {
    const rows = createRows(Array.from({ length: 31 }, (_, index) => `id-${index}`));
    pageResponses = [rows.slice(0, CHAT_MESSAGES_PAGE_SIZE)];

    const page = await fetchMessagePage({
      currentUserId: CURRENT_USER_ID,
      otherUserId: OTHER_USER_ID,
      apartmentId: APARTMENT_ID,
    });

    expect(page.messages).toHaveLength(CHAT_MESSAGES_PAGE_SIZE);
    expect(page.messages.map((message) => message.id)).toEqual(
      rows.slice(0, CHAT_MESSAGES_PAGE_SIZE).map((row) => row.id)
    );
    expect(page.nextCursor).toEqual({
      createdAt: rows[CHAT_MESSAGES_PAGE_SIZE - 1].created_at,
      id: rows[CHAT_MESSAGES_PAGE_SIZE - 1].id,
    });
    expect(queryLogs[0].order).toHaveBeenNthCalledWith(1, 'created_at', { ascending: false });
    expect(queryLogs[0].order).toHaveBeenNthCalledWith(2, 'id', { ascending: false });
    expect(queryLogs[0].limit).toHaveBeenCalledWith(CHAT_MESSAGES_PAGE_SIZE);
  });

  /** Validates: Requirements 1.4, 2.4 */
  it('Property: cursor pages retain every generated tied-timestamp row exactly once', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uniqueArray(fc.uuid(), { minLength: 31, maxLength: 91 }),
        async (ids) => {
          const rows = createRows(ids);
          pageResponses = Array.from(
            { length: Math.ceil(rows.length / CHAT_MESSAGES_PAGE_SIZE) },
            (_, index) => rows.slice(
              index * CHAT_MESSAGES_PAGE_SIZE,
              (index + 1) * CHAT_MESSAGES_PAGE_SIZE
            )
          );
          queryLogs = [];

          const allMessageIds: string[] = [];
          let page = await fetchMessagePage({
            currentUserId: CURRENT_USER_ID,
            otherUserId: OTHER_USER_ID,
            apartmentId: APARTMENT_ID,
          });
          allMessageIds.push(...page.messages.map((message) => message.id));

          while (page.nextCursor) {
            const cursor = page.nextCursor;
            page = await fetchMessagePage({
              currentUserId: CURRENT_USER_ID,
              otherUserId: OTHER_USER_ID,
              apartmentId: APARTMENT_ID,
              cursor,
            });
            allMessageIds.push(...page.messages.map((message) => message.id));
          }

          expect(allMessageIds).toEqual(rows.map((row) => row.id));
          expect(new Set(allMessageIds).size).toBe(allMessageIds.length);
          expect(queryLogs[1]?.or).toHaveBeenLastCalledWith(
            `created_at.lt.${rows[CHAT_MESSAGES_PAGE_SIZE - 1].created_at},and(created_at.eq.${rows[CHAT_MESSAGES_PAGE_SIZE - 1].created_at},id.lt.${rows[CHAT_MESSAGES_PAGE_SIZE - 1].id})`
          );
        }
      ),
      { numRuns: 10 }
    );
  });
});

describe('mergeChatMessages', () => {
  /** Validates: Requirements 2.4, 3.3, 3.6 */
  it('Property: optimistic, broadcast, and older-page arrivals remain duplicate-free', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(fc.uuid(), { minLength: 1, maxLength: 20 }),
        fc.array(fc.uuid(), { minLength: 1, maxLength: 20 }),
        (existingIds, incomingIds) => {
          const existing = existingIds.map(createMessage);
          const incoming = incomingIds.map(createMessage);

          const withNewest = mergeChatMessages(existing, incoming, 'newest');
          const withOlderDuplicate = mergeChatMessages(withNewest, incoming, 'older');

          expect(new Set(withOlderDuplicate.map((message) => message.id)).size).toBe(
            withOlderDuplicate.length
          );
          expect(withOlderDuplicate.slice(0, withNewest.length)).toEqual(withNewest);
        }
      ),
      { numRuns: 10 }
    );
  });
});
