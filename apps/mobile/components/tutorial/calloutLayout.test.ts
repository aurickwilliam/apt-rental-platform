import { computeCalloutLayout, estimateNativeTabRect } from './calloutLayout';

const window = { width: 400, height: 800 };
const insets = { top: 50, bottom: 34 };

describe('computeCalloutLayout', () => {
  it('hovers above a target in the lower half, centered on it, with the arrow on its center', () => {
    const hole = { x: 150, y: 720, width: 100, height: 60 };
    const layout = computeCalloutLayout({ hole, window, insets });
    expect(layout.placement).toBe('above');
    expect(layout.bottom).toBe(window.height - hole.y + 14);
    expect(layout.left + layout.arrowCenter!).toBe(200);
  });

  it('hovers below a target in the upper half', () => {
    const hole = { x: 20, y: 100, width: 80, height: 40 };
    const layout = computeCalloutLayout({ hole, window, insets });
    expect(layout.placement).toBe('below');
    expect(layout.top).toBe(140 + 14);
  });

  it('keeps the card on screen at the edges while the arrow still points at the target', () => {
    const hole = { x: 4, y: 720, width: 60, height: 60 };
    const layout = computeCalloutLayout({ hole, window, insets });
    expect(layout.left).toBe(16);
    expect(layout.left + layout.width).toBeLessThanOrEqual(window.width - 16);
    expect(layout.arrowCenter).toBeGreaterThanOrEqual(24);
    expect(layout.arrowCenter).toBeLessThanOrEqual(layout.width - 24);

    const far = computeCalloutLayout({ hole: { x: 340, y: 720, width: 56, height: 60 }, window, insets });
    expect(far.left + far.width).toBeLessThanOrEqual(window.width - 16);
  });

  it('floats at the bottom with no arrow when there is no target', () => {
    const layout = computeCalloutLayout({ hole: null, window, insets });
    expect(layout.placement).toBe('floating');
    expect(layout.arrowCenter).toBeNull();
    expect(layout.bottom).toBeGreaterThan(insets.bottom);
  });
});

describe('estimateNativeTabRect', () => {
  it('splits the bar evenly and finds the tab by name', () => {
    const search = estimateNativeTabRect('tenant', 'search', window, insets)!;
    const chat = estimateNativeTabRect('tenant', 'chat', window, insets)!;
    expect(chat.x - search.x).toBeCloseTo(search.width);
    expect(search.y + search.height).toBeLessThanOrEqual(window.height);
  });

  it('uses each portal\'s own tab order and ignores unknown tabs', () => {
    expect(estimateNativeTabRect('landlord', 'units', window, insets)).not.toBeNull();
    expect(estimateNativeTabRect('landlord', 'search', window, insets)).toBeNull();
    expect(estimateNativeTabRect('tenant', null, window, insets)).toBeNull();
  });
});
