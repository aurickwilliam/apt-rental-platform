import { insertAtSelection } from './emojiPicker';

jest.mock('@/hooks/useTheme', () => ({ useColors: () => ({ colors: {}, isDark: false }) }));

describe('insertAtSelection', () => {
  it('inserts at the cursor and moves the cursor past the emoji', () => {
    expect(insertAtSelection('Hi there', { start: 2, end: 2 }, '😂')).toEqual({
      text: 'Hi😂 there',
      cursor: 4,
    });
  });

  it('replaces selected text', () => {
    expect(insertAtSelection('Hi there', { start: 3, end: 8 }, '👋')).toEqual({
      text: 'Hi 👋',
      cursor: 5,
    });
  });

  it('appends when there is no known cursor', () => {
    expect(insertAtSelection('Hi', null, '🙏')).toEqual({ text: 'Hi🙏', cursor: 4 });
  });

  it('clamps a stale cursor from a longer, since-cleared message', () => {
    expect(insertAtSelection('', { start: 12, end: 12 }, '❤️')).toEqual({
      text: '❤️',
      cursor: 2,
    });
  });
});
