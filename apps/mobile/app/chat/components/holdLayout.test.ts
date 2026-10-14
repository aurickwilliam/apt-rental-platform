import { computeHoldLayout, type HoldViewport } from './holdLayout';

const viewport: HoldViewport = {
  screenH: 800,
  usableTop: 100,
  usableBottom: 700,
};

function anchorAt(pageY: number, height = 60) {
  return { pageX: 16, pageY, width: 200, height };
}

describe('computeHoldLayout', () => {
  it('stacks reactions above, the bubble, then actions below, centered vertically', () => {
    // Stack: 50 + 8 + 60 + 8 + 180 = 306, centered in 600 → top 100 + 147 = 247.
    const layout = computeHoldLayout(anchorAt(620), { reactionsH: 50, menuH: 180 }, viewport);

    expect(layout.reactionsTop).toBe(247);
    expect(layout.bubbleTop).toBe(247 + 50 + 8);
    expect(layout.menuTop).toBe(247 + 50 + 8 + 60 + 8);
    expect(layout.bubbleMoved).toBe(true);
  });

  it('centers the same way wherever the bubble was in the chat', () => {
    const fromTop = computeHoldLayout(anchorAt(110), { reactionsH: 50, menuH: 180 }, viewport);
    const fromBottom = computeHoldLayout(anchorAt(640), { reactionsH: 50, menuH: 180 }, viewport);

    expect(fromTop.bubbleTop).toBe(fromBottom.bubbleTop);
  });

  it('skips the reaction row when the message cannot be reacted to', () => {
    // Stack: 60 + 8 + 180 = 248 → top 100 + 176 = 276.
    const layout = computeHoldLayout(anchorAt(500), { reactionsH: 0, menuH: 180 }, viewport);

    expect(layout.bubbleTop).toBe(276);
    expect(layout.menuTop).toBe(276 + 60 + 8);
  });

  it('reports no movement when the bubble already sits in its slot', () => {
    const layout = computeHoldLayout(anchorAt(305), { reactionsH: 50, menuH: 180 }, viewport);

    expect(layout.bubbleMoved).toBe(false);
  });

  it('pins a taller-than-viewport stack to the top and keeps the actions on screen', () => {
    // A 500-tall photo: 50 + 8 + 500 + 8 + 180 = 746 > 600.
    const layout = computeHoldLayout(anchorAt(200, 500), { reactionsH: 50, menuH: 180 }, viewport);

    expect(layout.reactionsTop).toBe(100);
    expect(layout.bubbleTop).toBe(158);
    expect(layout.menuTop).toBe(700 - 180);
  });
});
