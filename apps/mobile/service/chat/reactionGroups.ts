import type { MessageReaction } from './chatService';

export interface ReactionGroup {
  emoji: string;
  count: number;
}

/**
 * One group per distinct emoji, in first-seen order, with how many people used
 * it — the same shape web draws (a single chip per emoji, a count only above one).
 */
export function groupReactionsByEmoji(reactions: readonly MessageReaction[]): ReactionGroup[] {
  const groups = new Map<string, number>();
  for (const reaction of reactions) {
    groups.set(reaction.emoji, (groups.get(reaction.emoji) ?? 0) + 1);
  }
  return [...groups.entries()].map(([emoji, count]) => ({ emoji, count }));
}
