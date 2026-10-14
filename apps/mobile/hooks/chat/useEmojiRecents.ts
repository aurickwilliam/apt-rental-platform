import { useRecentPicksPersistence } from 'rn-emoji-keyboard';

import { loadRecentEmojis, saveRecentEmojis } from '@/service/chat/emojiRecentsStorage';

/**
 * Restores and saves the emoji pickers' "Recently used" row. The picker
 * library keeps one shared list, so call this once per chat screen.
 */
export function useEmojiRecents() {
  useRecentPicksPersistence({
    initialization: loadRecentEmojis,
    onStateChange: saveRecentEmojis,
  });
}
