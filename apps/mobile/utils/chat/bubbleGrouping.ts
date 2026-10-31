interface GroupedMessage {
  isSent: boolean;
  /** Local calendar day of the message (`getChatDayKey`); a new day ends a run (a divider sits between). */
  dayKey?: string;
}

/** Same sender, and the same day when both days are known. */
function sameRun(a: GroupedMessage, b: GroupedMessage): boolean {
  return a.isSent === b.isSent && (!a.dayKey || !b.dayKey || a.dayKey === b.dayKey);
}

/**
 * Whether a received message closes its run of consecutive received messages,
 * so the sender's avatar sits beside it (Messenger style). `messages` is
 * newest-first, as the inverted chat list renders it.
 */
export function showsSenderAvatar(messages: readonly GroupedMessage[], index: number): boolean {
  const message = messages[index];
  if (!message || message.isSent) return false;
  const newer = messages[index - 1];
  return !newer || !sameRun(message, newer);
}

/** Width reserved left of received bubbles for the avatar: `w-8` + `mr-2`. */
export const SENDER_AVATAR_GUTTER = 40;

/**
 * Where a bubble sits in a run of consecutive messages from the same sender,
 * top to bottom: the corners where bubbles meet shrink and the gap tightens
 * (Messenger style). `messages` is newest-first, as the inverted list renders it.
 */
export type BubbleGroupPosition = 'single' | 'first' | 'middle' | 'last';

export function getBubbleGroupPosition(
  messages: readonly GroupedMessage[],
  index: number
): BubbleGroupPosition {
  const message = messages[index];
  if (!message) return 'single';
  const above = messages[index + 1];
  const below = messages[index - 1];
  const joinsAbove = !!above && sameRun(message, above);
  const joinsBelow = !!below && sameRun(message, below);
  if (joinsAbove && joinsBelow) return 'middle';
  if (joinsAbove) return 'last';
  if (joinsBelow) return 'first';
  return 'single';
}

/** The run continues below this bubble, so the gap after it tightens. */
export function continuesBelow(position: BubbleGroupPosition): boolean {
  return position === 'first' || position === 'middle';
}
