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

  it('renders the same inline row in bare mode (single menu card)', () => {
    const onSelect = jest.fn();
    render(<ReactionStrip bare myReaction="❤️" onSelect={onSelect} />);

    // Same 6 quick reactions + picker button, no separate pill surface.
    expect(screen.getByLabelText('React with ❤️')).toBeTruthy();
    expect(screen.getByLabelText('React with 👍')).toBeTruthy();
    expect(screen.getByLabelText('More reactions')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('React with 😂'));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('😂');
  });
});
