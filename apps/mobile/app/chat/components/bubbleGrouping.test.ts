import { showsSenderAvatar } from './bubbleGrouping';

// Newest first, like the inverted chat list.
const messages = [
  { isSent: true }, // 0: mine, newest
  { isSent: false }, // 1: theirs — last of their run → avatar
  { isSent: false }, // 2: theirs — earlier in the run
  { isSent: true }, // 3: mine
  { isSent: false }, // 4: theirs, alone → avatar
];

describe('showsSenderAvatar', () => {
  it('puts the avatar on the newest message of each received run', () => {
    expect(messages.map((_, index) => showsSenderAvatar(messages, index))).toEqual([
      false,
      true,
      false,
      false,
      true,
    ]);
  });

  it('shows the avatar on the newest message when it is received', () => {
    expect(showsSenderAvatar([{ isSent: false }, { isSent: false }], 0)).toBe(true);
  });

  it('is false for a missing index', () => {
    expect(showsSenderAvatar([], 0)).toBe(false);
  });
});
