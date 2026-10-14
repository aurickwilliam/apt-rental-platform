import { fireEvent, render, screen } from '@testing-library/react-native';

import ChatApartmentCard from './ChatApartmentCard';

jest.mock('@/hooks/useTheme', () => ({
  useColors: () => ({ colors: { gray500: '#6C757D' }, isDark: false }),
}));

jest.mock('expo-image', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  return { Image: (props: object) => React.createElement(View, { ...props, testID: 'apartment-thumb' }) };
});

// heroui-native ships untranspiled ESM that Jest cannot parse.
jest.mock('heroui-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Pressable } = jest.requireActual<typeof import('react-native')>('react-native');
  type MockProps = Record<string, unknown> & { children?: React.ReactNode };
  const PressableFeedbackMock = Object.assign(
    ({ children, ...props }: MockProps) => React.createElement(Pressable, props, children),
    { Highlight: () => null }
  );
  return { PressableFeedback: PressableFeedbackMock };
});

jest.mock('@tabler/icons-react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const mockIcon = () => React.createElement(View);
  return { IconBuilding: mockIcon, IconChevronRight: mockIcon };
});

const apartment = {
  id: 'apt-1',
  name: 'Concepcion Quiet 1BR',
  location: 'Maypajo, Caloocan',
  monthlyRent: 15000,
  thumbnailUrl: 'https://cdn.example/thumb.jpg',
};

describe('ChatApartmentCard', () => {
  it('shows the photo, name, area and monthly rent', () => {
    render(<ChatApartmentCard apartment={apartment} onPress={jest.fn()} />);

    expect(screen.getByTestId('apartment-thumb')).toBeTruthy();
    expect(screen.getByText('Concepcion Quiet 1BR')).toBeTruthy();
    expect(screen.getByText('Maypajo, Caloocan')).toBeTruthy();
    expect(screen.getByText('₱ 15,000')).toBeTruthy();
    expect(
      screen.getByLabelText('Concepcion Quiet 1BR, Maypajo, Caloocan, ₱ 15,000 a month')
    ).toBeTruthy();
  });

  it('opens the apartment when tapped', () => {
    const onPress = jest.fn();
    render(<ChatApartmentCard apartment={apartment} onPress={onPress} />);

    fireEvent.press(screen.getByRole('button'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('falls back to a building icon without a photo', () => {
    render(
      <ChatApartmentCard apartment={{ ...apartment, thumbnailUrl: null }} onPress={jest.fn()} />
    );

    expect(screen.queryByTestId('apartment-thumb')).toBeNull();
  });
});
