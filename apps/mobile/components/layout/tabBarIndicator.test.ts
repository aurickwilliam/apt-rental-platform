import {
  clampIndicatorX,
  indicatorRestX,
  isTouchOnIndicator,
  nearestTabIndex,
  type TabIndicatorLayout,
} from './tabBarIndicator';

// Four tabs, 80 wide, 12 apart, 4 of padding: rests at 4, 96, 188, 280.
const layout: TabIndicatorLayout = { itemWidth: 80, gap: 12, padding: 4, count: 4 };

describe('tab indicator geometry', () => {
  it('computes each resting position', () => {
    expect([0, 1, 2, 3].map((i) => indicatorRestX(i, layout))).toEqual([4, 96, 188, 280]);
  });

  it('clamps a drag between the first and last tab', () => {
    expect(clampIndicatorX(-50, layout)).toBe(4);
    expect(clampIndicatorX(150, layout)).toBe(150);
    expect(clampIndicatorX(900, layout)).toBe(280);
  });

  it('snaps to the nearest tab', () => {
    expect(nearestTabIndex(4, layout)).toBe(0);
    expect(nearestTabIndex(49, layout)).toBe(0);
    expect(nearestTabIndex(51, layout)).toBe(1);
    expect(nearestTabIndex(236, layout)).toBe(3);
  });

  it('never snaps outside the tab range', () => {
    expect(nearestTabIndex(-300, layout)).toBe(0);
    expect(nearestTabIndex(900, layout)).toBe(3);
  });

  it('falls back to the first tab before layout is measured', () => {
    expect(nearestTabIndex(100, { ...layout, itemWidth: 0, gap: 0 })).toBe(0);
  });

  it('detects touches on the indicator only', () => {
    expect(isTouchOnIndicator(100, 96, 80)).toBe(true);
    expect(isTouchOnIndicator(90, 96, 80)).toBe(false);
    expect(isTouchOnIndicator(180, 96, 80)).toBe(false);
  });
});
