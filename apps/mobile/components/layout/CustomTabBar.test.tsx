import { render, fireEvent } from '@testing-library/react-native';

import { CustomTabBar, formatBadge, type CustomTabConfig } from './CustomTabBar';

jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: { View },
    useSharedValue: (value: number) => ({ value }),
    useAnimatedStyle: (fn: () => object) => fn(),
    useDerivedValue: (fn: () => number) => ({ value: fn() }),
    withSpring: (value: number) => value,
    withTiming: (value: number) => value,
    withSequence: (...values: number[]) => values[values.length - 1],
    interpolate: () => 0,
    Extrapolation: { CLAMP: 'clamp' },
    ReduceMotion: { System: 'system' },
  };
});

jest.mock('expo-router', () => ({
  useFocusEffect: jest.fn(),
  useScrollToTop: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('hooks/useTheme', () => {
  const { MOBILE_COLORS } = jest.requireActual('../../constants/theme');
  return { useColors: () => ({ colors: MOBILE_COLORS.light, isDark: false }) };
});

type BarProps = Omit<React.ComponentProps<typeof CustomTabBar>, 'tabs'>;

const Icon = () => null;

const tabs: CustomTabConfig[] = [
  { name: 'rentals', label: 'Rentals', icon: Icon, iconFilled: Icon },
  { name: 'chat', label: 'Chat', icon: Icon, iconFilled: Icon, badge: 3 },
  { name: 'profile', label: 'Profile', icon: Icon, iconFilled: Icon, badge: 120 },
];

function renderBar(index = 0) {
  const navigation = {
    emit: jest.fn(() => ({ defaultPrevented: false })),
    navigate: jest.fn(),
  };
  const state = {
    index,
    routes: tabs.map((tab) => ({ key: `${tab.name}-key`, name: tab.name })),
  };
  const utils = render(
    <CustomTabBar
      {...(({ state, navigation, descriptors: {}, insets: {} }) as unknown as BarProps)}
      tabs={tabs}
    />
  );
  return { ...utils, navigation };
}

describe('formatBadge', () => {
  it('caps large counts', () => {
    expect(formatBadge(7)).toBe('7');
    expect(formatBadge(99)).toBe('99');
    expect(formatBadge(100)).toBe('99+');
  });
});

describe('CustomTabBar', () => {
  it('marks only the focused tab as selected', () => {
    const { getByLabelText } = renderBar(0);
    expect(getByLabelText('Rentals').props.accessibilityState).toEqual({ selected: true });
    expect(getByLabelText('Chat, 3 unread').props.accessibilityState).toEqual({
      selected: false,
    });
  });

  it('shows badges with an accessible label and caps the count', () => {
    const { getByTestId, getByLabelText } = renderBar(0);
    expect(getByTestId('tab-badge-chat')).toBeTruthy();
    expect(getByLabelText('Profile, 120 unread')).toBeTruthy();
  });

  it('navigates when another tab is pressed', () => {
    const { getByLabelText, navigation } = renderBar(0);
    fireEvent.press(getByLabelText('Chat, 3 unread'));
    expect(navigation.navigate).toHaveBeenCalledWith('chat');
  });

  it('emits tabPress but does not navigate when the focused tab is pressed again', () => {
    const { getByLabelText, navigation } = renderBar(0);
    fireEvent.press(getByLabelText('Rentals'));
    expect(navigation.emit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'tabPress', target: 'rentals-key' })
    );
    expect(navigation.navigate).not.toHaveBeenCalled();
  });
});
