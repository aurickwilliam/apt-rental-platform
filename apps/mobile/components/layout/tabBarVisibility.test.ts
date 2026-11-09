import {
  nextTabBarVisibility,
  TAB_BAR_ALWAYS_SHOW_OFFSET,
} from './tabBarVisibility';

const base = { contentHeight: 2000, layoutHeight: 800 };

describe('nextTabBarVisibility', () => {
  it('hides on a clear downward scroll past the start offset', () => {
    expect(
      nextTabBarVisibility({ ...base, prevY: 200, y: 230, hidden: false })
    ).toBe(true);
  });

  it('shows on a clear upward scroll', () => {
    expect(
      nextTabBarVisibility({ ...base, prevY: 400, y: 380, hidden: true })
    ).toBe(false);
  });

  it('ignores tiny movements', () => {
    expect(
      nextTabBarVisibility({ ...base, prevY: 400, y: 404, hidden: true })
    ).toBe(true);
    expect(
      nextTabBarVisibility({ ...base, prevY: 400, y: 404, hidden: false })
    ).toBe(false);
  });

  it('always shows near the top', () => {
    expect(
      nextTabBarVisibility({
        ...base,
        prevY: 0,
        y: TAB_BAR_ALWAYS_SHOW_OFFSET,
        hidden: true,
      })
    ).toBe(false);
  });

  it('always shows near the bottom edge', () => {
    expect(
      nextTabBarVisibility({ ...base, prevY: 1100, y: 1170, hidden: true })
    ).toBe(false);
  });

  it('keeps state during bottom overscroll and shows on top overscroll', () => {
    expect(
      nextTabBarVisibility({ ...base, prevY: 1200, y: 1230, hidden: true })
    ).toBe(true);
    expect(
      nextTabBarVisibility({ ...base, prevY: 0, y: -40, hidden: true })
    ).toBe(false);
  });

  it('stays visible when content fits the screen', () => {
    expect(
      nextTabBarVisibility({
        prevY: 0,
        y: 100,
        contentHeight: 600,
        layoutHeight: 800,
        hidden: false,
      })
    ).toBe(false);
  });
});
