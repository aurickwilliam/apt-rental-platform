import { groupReactionsByEmoji } from './reactionGroups';

const reaction = (userId: string, emoji: string) => ({ userId, emoji, isMine: false });

describe('groupReactionsByEmoji', () => {
  it('merges identical emoji into one group with a count', () => {
    expect(groupReactionsByEmoji([reaction('a', '👍'), reaction('b', '👍')])).toEqual([
      { emoji: '👍', count: 2 },
    ]);
  });

  it('keeps distinct emoji separate, in first-seen order', () => {
    expect(
      groupReactionsByEmoji([reaction('a', '😂'), reaction('b', '👍'), reaction('c', '😂')])
    ).toEqual([
      { emoji: '😂', count: 2 },
      { emoji: '👍', count: 1 },
    ]);
  });

  it('returns nothing for no reactions', () => {
    expect(groupReactionsByEmoji([])).toEqual([]);
  });
});
