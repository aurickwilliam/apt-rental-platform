import { fireEvent, render, screen } from '@testing-library/react-native';

import ChatHeader from './ChatHeader';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/hooks/useTheme', () => ({
  useColors: () => ({
    colors: { primary: '#2F62DE', secondaryForeground: '#FFFFFF' },
    isDark: false,
  }),
}));

// heroui-native ships untranspiled ESM that Jest cannot parse — stub the used
// primitives with real hosts so press and text queries work.
jest.mock('heroui-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Pressable, Text, View } = jest.requireActual<typeof import('react-native')>('react-native');
  type MockProps = Record<string, unknown> & { children?: React.ReactNode };
  const AvatarMock = Object.assign(
    ({ children }: MockProps) => React.createElement(View, null, children),
    {
      Image: () => null,
      Fallback: ({ children }: MockProps) => React.createElement(View, null, children),
    }
  );
  const ButtonMock = Object.assign(
    ({ children, ...props }: MockProps) =>
      React.createElement(Pressable, { accessibilityRole: 'button', ...props }, children),
    { Label: ({ children }: MockProps) => React.createElement(Text, null, children) }
  );
  return { Avatar: AvatarMock, Button: ButtonMock };
});

jest.mock('@tabler/icons-react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const mockIcon = (props: object) => React.createElement(View, props);
  return {
    IconChevronLeft: mockIcon,
    IconPhone: mockIcon,
  };
});

describe('ChatHeader', () => {
  it('opens the other person\'s profile when the title is tapped', () => {
    const onViewProfile = jest.fn();
    render(<ChatHeader name="Case Oh" apartmentTitle="Parada 3BR" onViewProfile={onViewProfile} />);

    fireEvent.press(screen.getByLabelText("View Case Oh's profile"));
    expect(onViewProfile).toHaveBeenCalledTimes(1);
  });

  it('shows the name and apartment title without a profile control when no route is available', () => {
    render(<ChatHeader name="Case Oh" apartmentTitle="Parada 3BR" />);

    expect(screen.queryByLabelText("View Case Oh's profile")).toBeNull();
    expect(screen.getByText('Case Oh')).toBeTruthy();
    expect(screen.getByText('Parada 3BR')).toBeTruthy();
  });
});
