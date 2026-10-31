import { createContext, useContext } from 'react';

import type { GestureType } from 'react-native-gesture-handler';
import type { SharedValue } from 'react-native-reanimated';

/** How far bubbles slide when the chat is swiped left to show times. */
export const TIMESTAMP_REVEAL_WIDTH = 72;

interface TimestampRevealValue {
  /** 0 (hidden) → TIMESTAMP_REVEAL_WIDTH (fully shown), driven by the list swipe. */
  reveal: SharedValue<number>;
  /** The list's swipe-left gesture; a sent bubble's swipe-to-reply wins over it. */
  listGesture: GestureType;
}

export const TimestampRevealContext = createContext<TimestampRevealValue | null>(null);

export function useTimestampReveal() {
  return useContext(TimestampRevealContext);
}

/** Clock time shown beside a bubble, e.g. "4:39 PM". Empty for unknown times. */
export function formatRevealTime(createdAt: string | undefined): string {
  if (!createdAt) return '';
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
