import { fireEvent, render, screen } from '@testing-library/react-native';

import ChatEmptyState from './ChatEmptyState';

jest.mock('@/hooks/useTheme', () => ({
  useColors: () => ({
    colors: { primary: '#2F62DE', gray500: '#6C757D' },
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
    IconBuilding: mockIcon,
    IconRosetteDiscountCheckFilled: mockIcon,
    IconShieldCheck: mockIcon,
    IconUser: mockIcon,
  };
});

describe('ChatEmptyState', () => {
  it('shows who the other person is, the verified badge and the safety note', () => {
    render(
      <ChatEmptyState
        otherUserName="Case Oh"
        apartmentTitle="Parada 3BR"
        otherPartyLabel="Tenant"
        isVerified
        hasMessages
      />
    );

    expect(screen.getByText('Case Oh')).toBeTruthy();
    expect(screen.getByText('Tenant · Parada 3BR')).toBeTruthy();
    expect(screen.getByLabelText('Verified account')).toBeTruthy();
    expect(screen.getByText('Keep payments inside APT, never through chat.')).toBeTruthy();
  });

  it('opens the profile and the apartment from the quick buttons', () => {
    const onViewProfile = jest.fn();
    const onViewApartment = jest.fn();
    render(
      <ChatEmptyState
        otherUserName="Case Oh"
        onViewProfile={onViewProfile}
        onViewApartment={onViewApartment}
      />
    );

    fireEvent.press(screen.getByText('View profile'));
    fireEvent.press(screen.getByText('View apartment'));

    expect(onViewProfile).toHaveBeenCalledTimes(1);
    expect(onViewApartment).toHaveBeenCalledTimes(1);
  });

  it('hides the badge and buttons when not available', () => {
    render(<ChatEmptyState otherUserName="Case Oh" apartmentTitle="Parada 3BR" />);

    expect(screen.getByText('Parada 3BR')).toBeTruthy();
    expect(screen.queryByLabelText('Verified account')).toBeNull();
    expect(screen.queryByText('View profile')).toBeNull();
    expect(screen.queryByText('View apartment')).toBeNull();
  });
});
