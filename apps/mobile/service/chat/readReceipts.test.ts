import { getNewestReceivedCreatedAt, getSeenMessageId, markSentReadUpTo } from './readReceipts';

const at = (minute: number) => `2026-10-14T08:${String(minute).padStart(2, '0')}:00.000Z`;

describe('getSeenMessageId', () => {
  it('picks the newest sent message they have read, skipping newer unread ones', () => {
    // Newest first.
    const messages = [
      { id: 'c', isSent: true, isRead: false, createdAt: at(3) },
      { id: 'b', isSent: true, isRead: true, createdAt: at(2) },
      { id: 'a', isSent: true, isRead: true, createdAt: at(1) },
    ];
    expect(getSeenMessageId(messages)).toBe('b');
  });

  it('shows nothing once they have replied, or before they read anything', () => {
    expect(
      getSeenMessageId([
        { id: 'reply', isSent: false, createdAt: at(3) },
        { id: 'mine', isSent: true, isRead: true, createdAt: at(2) },
      ])
    ).toBeNull();
    expect(getSeenMessageId([{ id: 'mine', isSent: true, isRead: false, createdAt: at(1) }])).toBeNull();
    expect(getSeenMessageId([])).toBeNull();
  });
});

describe('markSentReadUpTo', () => {
  it('marks my sent messages up to the read point, not later or pending ones', () => {
    const messages = [
      { id: 'later', isSent: true, isRead: false, createdAt: at(5) },
      { id: 'pending', isSent: true, isRead: false, isPending: true, createdAt: at(2) },
      { id: 'theirs', isSent: false, createdAt: at(2) },
      { id: 'mine', isSent: true, isRead: false, createdAt: at(1) },
    ];
    const result = markSentReadUpTo(messages, at(3));
    expect(result.map((message) => [message.id, message.isRead ?? false])).toEqual([
      ['later', false],
      ['pending', false],
      ['theirs', false],
      ['mine', true],
    ]);
  });

  it('ignores an invalid read point', () => {
    const messages = [{ id: 'mine', isSent: true, isRead: false, createdAt: at(1) }];
    expect(markSentReadUpTo(messages, 'nope')[0].isRead).toBe(false);
  });
});

describe('getNewestReceivedCreatedAt', () => {
  it('returns the newest message from the other person', () => {
    expect(
      getNewestReceivedCreatedAt([
        { id: 'mine', isSent: true, createdAt: at(9) },
        { id: 'old', isSent: false, createdAt: at(1) },
        { id: 'new', isSent: false, createdAt: at(4) },
      ])
    ).toBe(at(4));
    expect(getNewestReceivedCreatedAt([{ id: 'mine', isSent: true, createdAt: at(1) }])).toBeNull();
  });
});
