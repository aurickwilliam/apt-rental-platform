import {
  buildConversationListItems,
  filterConversations,
  getChatRouteParams,
  groupConversations,
  hasUnread,
  sortUnreadFirst,
  toConversationItem,
} from './conversationList';

import type { ConversationWithMeta } from './conversationService';
import { DEFAULT_CONVERSATION_PREFERENCES } from '@/service/chat/conversationPreferences';

function makeConversation(
  conversationKey: string,
  overrides: Partial<ConversationWithMeta> = {}
): ConversationWithMeta {
  return {
    conversation_key: conversationKey,
    other_user_id: `user-${conversationKey}`,
    other_user_name: `User ${conversationKey}`,
    other_user_avatar: null,
    other_user_phone: '09171234567',
    apartment_id: `apt-${conversationKey}`,
    apartment_name: `Apartment ${conversationKey}`,
    last_message: 'hello',
    last_message_type: 'text',
    last_message_time: '2026-01-01T00:00:00Z',
    unread_count: 0,
    last_sender_id: null,
    last_sender_is_me: false,
    conversation_type: 'inquiry',
    ...DEFAULT_CONVERSATION_PREFERENCES,
    ...overrides,
  };
}

describe('sortUnreadFirst', () => {
  it('moves unread conversations first, preserving order within groups', () => {
    const input = [
      makeConversation('read-1'),
      makeConversation('unread-1', { unread_count: 2 }),
      makeConversation('read-2'),
      makeConversation('unread-2', { unread_count: 1 }),
    ];

    expect(sortUnreadFirst(input).map((c) => c.conversation_key)).toEqual([
      'unread-1',
      'unread-2',
      'read-1',
      'read-2',
    ]);
  });

  it('keeps the existing order when nothing is unread', () => {
    const input = [makeConversation('a'), makeConversation('b')];

    expect(sortUnreadFirst(input).map((c) => c.conversation_key)).toEqual(['a', 'b']);
  });

  it('handles an empty list', () => {
    expect(sortUnreadFirst([])).toEqual([]);
  });
});

describe('filterConversations', () => {
  const conversations = [
    makeConversation('1', { other_user_name: 'Maria Santos', apartment_name: 'Sunrise Loft' }),
    makeConversation('2', { other_user_name: 'Jose Cruz', last_message: 'Is the unit available?' }),
    makeConversation('3', { other_user_name: 'Ana Reyes', apartment_name: null, last_message: null }),
  ];

  it('keeps everything for a blank or spaces-only query', () => {
    expect(filterConversations(conversations, '')).toHaveLength(3);
    expect(filterConversations(conversations, '   ')).toHaveLength(3);
  });

  it('ignores surrounding spaces and letter case', () => {
    expect(
      filterConversations(conversations, '  maria ').map((c) => c.conversation_key)
    ).toEqual(['1']);
  });

  it('matches the property and the last message', () => {
    expect(filterConversations(conversations, 'loft').map((c) => c.conversation_key)).toEqual(['1']);
    expect(
      filterConversations(conversations, 'available').map((c) => c.conversation_key)
    ).toEqual(['2']);
  });

  it('handles conversations without a property or message', () => {
    expect(filterConversations(conversations, 'reyes').map((c) => c.conversation_key)).toEqual([
      '3',
    ]);
  });
});

describe('getChatRouteParams', () => {
  it('builds chat route params without the phone number', () => {
    const params = getChatRouteParams(makeConversation('1', { apartment_id: null }));

    expect(params).toEqual({
      conversationId: '1',
      otherUserId: 'user-1',
      otherUserName: 'User 1',
      otherUserAvatar: '',
      apartmentId: '',
      apartmentTitle: 'Apartment 1',
    });
    expect(JSON.stringify(params)).not.toContain('0917');
  });
});

describe('hasUnread', () => {
  it('counts unread messages and manual "mark unread"', () => {
    expect(hasUnread(makeConversation('a', { unread_count: 1 }))).toBe(true);
    expect(hasUnread(makeConversation('b', { marked_unread: true }))).toBe(true);
    expect(hasUnread(makeConversation('c'))).toBe(false);
  });
});

describe('groupConversations', () => {
  it('splits pinned (newest pin first), others (unread first) and archived', () => {
    const groups = groupConversations([
      makeConversation('old-pin', { is_pinned: true, pinned_at: '2026-01-01T00:00:00Z' }),
      makeConversation('read'),
      makeConversation('archived', { is_archived: true }),
      makeConversation('new-pin', { is_pinned: true, pinned_at: '2026-01-03T00:00:00Z' }),
      makeConversation('marked', { marked_unread: true }),
    ]);

    expect(groups.pinned.map((c) => c.conversation_key)).toEqual(['new-pin', 'old-pin']);
    expect(groups.others.map((c) => c.conversation_key)).toEqual(['marked', 'read']);
    expect(groups.archived.map((c) => c.conversation_key)).toEqual(['archived']);
  });

  it('keeps an always-pinned conversation on top even when archived', () => {
    const groups = groupConversations(
      [
        makeConversation('pin', { is_pinned: true, pinned_at: '2026-01-03T00:00:00Z' }),
        makeConversation('landlord', { is_archived: true }),
      ],
      (conversation) => conversation.conversation_key === 'landlord'
    );

    expect(groups.pinned.map((c) => c.conversation_key)).toEqual(['landlord', 'pin']);
    expect(groups.archived).toEqual([]);
  });
});

describe('buildConversationListItems', () => {
  it('adds a separator after pinned rows and an archived row at the end', () => {
    const items = buildConversationListItems({
      pinned: [toConversationItem(makeConversation('p'), true)],
      others: [makeConversation('o')],
      archivedCount: 2,
    });

    expect(items.map((item) => item.key)).toEqual(['p', 'separator', 'o', 'archived']);
    expect(items[0]).toMatchObject({ kind: 'conversation', isPinLocked: true });
    expect(items[3]).toMatchObject({ kind: 'archived', count: 2 });
  });

  it('has no separator without pinned rows, and no archived row when none are archived', () => {
    const items = buildConversationListItems({
      pinned: [],
      others: [makeConversation('o')],
      archivedCount: 0,
    });

    expect(items.map((item) => item.key)).toEqual(['o']);
  });
});
