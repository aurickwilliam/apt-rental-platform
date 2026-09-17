import { computeHoldLayout, type HoldViewport } from './holdLayout';

const viewport: HoldViewport = {
  screenH: 800,
  usableTop: 100,
  usableBottom: 710,
};

// Menu (h=300) centers at 100 + (610 - 300) / 2 = 255, bottom = 555.
const MENU_H = 300;
const MENU_TOP = 255;
const MENU_BOTTOM = 555;

function anchorAt(pageY: number, height = 60) {
  return { pageX: 16, pageY, width: 200, height };
}

describe('computeHoldLayout', () => {
  it('keeps a top message stationary when there is room (Case 3)', () => {
    const layout = computeHoldLayout(anchorAt(110), MENU_H, viewport);

    expect(layout.menuTop).toBe(MENU_TOP);
    expect(layout.bubbleMoved).toBe(false);
    expect(layout.bubbleTop).toBe(110);
  });

  it('keeps a middle message stationary when clear of the menu (Case 1)', () => {
    // Below the menu with a gap: 555 + 8 = 563.
    const layout = computeHoldLayout(anchorAt(580), MENU_H, viewport);

    expect(layout.menuTop).toBe(MENU_TOP);
    expect(layout.bubbleMoved).toBe(false);
    expect(layout.bubbleTop).toBe(580);
  });

  it('keeps a bottom message stationary when clear (Case 4)', () => {
    const layout = computeHoldLayout(anchorAt(640), MENU_H, viewport);

    expect(layout.bubbleMoved).toBe(false);
    expect(layout.bubbleTop).toBe(640);
  });

  it('moves an overlapping bubble above the menu, nearest side (Case 2)', () => {
    // Bubble center (300 + 30) sits above menu center (405).
    const layout = computeHoldLayout(anchorAt(300), MENU_H, viewport);

    expect(layout.menuTop).toBe(MENU_TOP);
    expect(layout.bubbleMoved).toBe(true);
    expect(layout.bubbleTop).toBe(MENU_TOP - 8 - 60);
  });

  it('moves an overlapping bubble below the menu when its center is lower', () => {
    // Bubble center (500 + 30) sits below menu center (405).
    const layout = computeHoldLayout(anchorAt(500, 100), MENU_H, viewport);

    expect(layout.bubbleMoved).toBe(true);
    expect(layout.bubbleTop).toBe(MENU_BOTTOM + 8);
  });

  it('clamps a top-breaching bubble inside the usable viewport', () => {
    const layout = computeHoldLayout(anchorAt(40), MENU_H, viewport);

    expect(layout.bubbleMoved).toBe(true);
    expect(layout.bubbleTop).toBeGreaterThanOrEqual(100);
  });

  it('clamps a bottom-breaching bubble inside the usable viewport', () => {
    const layout = computeHoldLayout(anchorAt(680, 60), MENU_H, viewport);

    expect(layout.bubbleMoved).toBe(true);
    expect(layout.bubbleTop + 60).toBeLessThanOrEqual(710);
  });

  it('treats edge-adjacent ranges with the spacing gap as colliding', () => {
    // Bubble bottom exactly at menu top: 195 + 60 = 255 → within GAP.
    const layout = computeHoldLayout(anchorAt(195), MENU_H, viewport);

    expect(layout.bubbleMoved).toBe(true);
  });

  it('centers the menu even when the bubble is far outside', () => {
    const layout = computeHoldLayout(anchorAt(-50, 60), MENU_H, viewport);

    expect(layout.menuTop).toBe(MENU_TOP);
    expect(layout.bubbleMoved).toBe(true);
  });
});
