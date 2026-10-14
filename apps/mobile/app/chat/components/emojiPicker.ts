import { useMemo } from 'react';

import { useColors } from '@/hooks/useTheme';

/** Height of the inline emoji panel under the chat box (about a keyboard). */
export const EMOJI_PANEL_HEIGHT = 300;

/**
 * Settings shared by the chat box's emoji panel and the reaction picker:
 * recently used first, search, and the app's colors (light and dark).
 */
export function useEmojiPickerSettings() {
  const { colors, isDark } = useColors();

  return useMemo(
    () => ({
      enableRecentlyUsed: true,
      enableSearchBar: true,
      categoryPosition: 'top' as const,
      theme: {
        backdrop: isDark ? '#00000099' : '#00000055',
        knob: colors.gray300,
        container: colors.surface,
        header: colors.gray500,
        skinTonesContainer: colors.surfaceSecondary,
        category: {
          icon: colors.gray500,
          iconActive: colors.primary,
          container: colors.surfaceSecondary,
          containerActive: isDark ? colors.surfaceTertiary : colors.primaryLight,
        },
        search: {
          background: colors.surfaceSecondary,
          text: colors.textPrimary,
          placeholder: colors.gray500,
          icon: colors.gray500,
        },
        emoji: { selected: colors.surfaceTertiary },
      },
    }),
    [colors, isDark]
  );
}

export interface TextSelection {
  start: number;
  end: number;
}

/**
 * Puts `insert` where the cursor is (replacing any selected text) and returns
 * the new text with the cursor just after the insert. A stale selection is
 * clamped to the text, so it falls back to appending.
 */
export function insertAtSelection(
  text: string,
  selection: TextSelection | null,
  insert: string
): { text: string; cursor: number } {
  const start = Math.min(selection?.start ?? text.length, text.length);
  const end = Math.min(Math.max(selection?.end ?? start, start), text.length);
  return {
    text: text.slice(0, start) + insert + text.slice(end),
    cursor: start + insert.length,
  };
}
