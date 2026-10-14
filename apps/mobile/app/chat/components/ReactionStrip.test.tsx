import { fireEvent, render, screen } from '@testing-library/react-native';

import ReactionStrip from './ReactionStrip';

jest.mock('@/hooks/useTheme', () => ({
  useColors: () => ({
    colors: {
      textPrimary: '#111',
    },
    isDark: false,
  }),
}));

// heroui-native ships untranspiled ESM that Jest cannot parse — stub the used
// primitives with real Pressable/View hosts so press and a11y queries work.
jest.mock('heroui-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Pressable, View } = jest.requireActual<typeof import('react-native')>('react-native');
  function ButtonMock({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) {
    return React.createElement(Pressable, { accessibilityRole: 'button', ...props }, children);
  }
  function SurfaceMock({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) {
    return React.createElement(View, props, children);
  }
  return { Button: ButtonMock, Surface: SurfaceMock };
});

jest.mock('@tabler/icons-react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const mockIcon = () => React.createElement(View);
  return { IconPlus: mockIcon };
});

describe('ReactionStrip', () => {
  it('renders the quick-reaction set', () => {
    render(<ReactionStrip />);

    expect(screen.getByLabelText('React with ❤️')).toBeTruthy();
    expect(screen.getByLabelText('React with 👍')).toBeTruthy();
    expect(screen.getByLabelText('More reactions')).toBeTruthy();
  });

  it('notifies the parent on emoji press', () => {
    const onSelect = jest.fn();
    render(<ReactionStrip onSelect={onSelect} />);

    fireEvent.press(screen.getByLabelText('React with 😂'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('😂');
  });

  it('opens the full picker on plus press', () => {
    const onOpenFullPicker = jest.fn();
    render(<ReactionStrip onOpenFullPicker={onOpenFullPicker} />);

    fireEvent.press(screen.getByLabelText('More reactions'));

    expect(onOpenFullPicker).toHaveBeenCalledTimes(1);
  });

  it('marks the current reaction as selected', () => {
    render(<ReactionStrip myReaction="😂" />);

    expect(screen.getByLabelText('React with 😂').props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByLabelText('React with ❤️').props.accessibilityState).toEqual({ selected: false });
  });
});
