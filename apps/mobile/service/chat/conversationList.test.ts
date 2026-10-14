import { filterConversations, getChatRouteParams, sortUnreadFirst } from './conversationList';

import type { ConversationWithMeta } from './conversationService';

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
