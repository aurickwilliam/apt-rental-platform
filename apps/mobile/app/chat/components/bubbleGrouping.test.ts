import { continuesBelow, getBubbleGroupPosition, showsSenderAvatar } from './bubbleGrouping';

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

describe('getBubbleGroupPosition', () => {
  // Newest first: index 0 is the bottom of the chat.
  const run = [
    { isSent: true }, // 0: bottom of my run of three
    { isSent: true }, // 1: middle
    { isSent: true }, // 2: top
    { isSent: false }, // 3: theirs, alone
  ];

  it('places each bubble in its run from top to bottom', () => {
    expect(run.map((_, index) => getBubbleGroupPosition(run, index))).toEqual([
      'last',
      'middle',
      'first',
      'single',
    ]);
  });

  it('treats a lone or missing message as single', () => {
    expect(getBubbleGroupPosition([{ isSent: true }], 0)).toBe('single');
    expect(getBubbleGroupPosition([], 0)).toBe('single');
  });

  it('tightens the gap only where the run continues below', () => {
    expect(continuesBelow('first')).toBe(true);
    expect(continuesBelow('middle')).toBe(true);
    expect(continuesBelow('last')).toBe(false);
    expect(continuesBelow('single')).toBe(false);
  });
});

describe('day dividers end a run', () => {
  // Newest first. Index 1 is on the previous day, so a divider sits above index 0.
  const today = new Date(2026, 9, 21, 9, 0, 0).toISOString();
  const yesterday = new Date(2026, 9, 20, 22, 0, 0).toISOString();
  const rows = [
    { isSent: true, createdAt: today },
    { isSent: true, createdAt: yesterday },
    { isSent: true, createdAt: yesterday },
  ];

  it('does not join bubbles across a day boundary', () => {
    expect(getBubbleGroupPosition(rows, 0)).toBe('single');
    expect(getBubbleGroupPosition(rows, 1)).toBe('last');
    expect(getBubbleGroupPosition(rows, 2)).toBe('first');
  });

  it('shows the sender avatar on the newest received bubble of each day', () => {
    const received = [
      { isSent: false, createdAt: today },
      { isSent: false, createdAt: yesterday },
    ];
    expect(showsSenderAvatar(received, 0)).toBe(true);
    expect(showsSenderAvatar(received, 1)).toBe(true);
  });
});
