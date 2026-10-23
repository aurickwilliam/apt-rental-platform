import { EMOJI_ONLY_SAMPLES, emojiFontSizeForCount } from '@repo/constants';

import { isEmojiOnly } from './chatService';

jest.mock('@repo/supabase', () => ({ supabase: {} }));

// Web detects emoji-only text with Unicode property escapes; both are tested against the same samples.
describe('isEmojiOnly', () => {
  it.each(EMOJI_ONLY_SAMPLES.emojiOnly)('treats %j as emoji only', (text) => {
    expect(isEmojiOnly(text)).toBe(true);
  });

  it.each([...EMOJI_ONLY_SAMPLES.notEmojiOnly, null, undefined])('does not treat %j as emoji only', (text) => {
    expect(isEmojiOnly(text as string | null | undefined)).toBe(false);
  });
});

describe('emojiFontSizeForCount', () => {
  it('steps down from one emoji to three or more', () => {
    expect([1, 2, 3, 8].map(emojiFontSizeForCount)).toEqual([46, 40, 34, 34]);
  });
});
