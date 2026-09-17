import { fireEvent, render, screen } from '@testing-library/react-native';

import HoldMenu, { type HoldMenuData } from './HoldMenu';

jest.mock('@/hooks/useTheme', () => ({
  useColors: () => ({
    colors: {
      textPrimary: '#111',
      gray400: '#9CA3AF',
      danger: '#DC2626',
    },
    isDark: false,
  }),
}));

jest.mock('@tabler/icons-react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  const mockIcon = () => React.createElement(View);
  return {
    IconArrowBackUp: mockIcon,
    IconCopy: mockIcon,
    IconTrash: mockIcon,
    IconPlus: mockIcon,
  };
});

const baseData: HoldMenuData = {
  dateLabel: 'Jul 8, 2026 at 7:49 PM',
  canReact: true,
  canCopy: true,
  canUnsend: true,
};

function renderMenu(overrides: Partial<HoldMenuData> = {}, handlers = {}) {
  const noop = jest.fn();
  return render(
    <HoldMenu
      data={{ ...baseData, ...overrides }}
      onSelectReaction={noop}
      onOpenFullPicker={noop}
      onReply={noop}
      onCopy={noop}
      onUnsend={noop}
      {...handlers}
    />
  );
}

describe('HoldMenu', () => {
  it('renders reactions, timestamp, and all actions — never the message', () => {
    renderMenu();

    expect(screen.getByLabelText('React with ❤️')).toBeTruthy();
    expect(screen.getByText('Jul 8, 2026 at 7:49 PM')).toBeTruthy();
    expect(screen.getByText('Reply')).toBeTruthy();
    expect(screen.getByText('Copy')).toBeTruthy();
    expect(screen.getByText('Unsend')).toBeTruthy();
  });

  it('fires reaction select, reply, copy, and unsend', () => {
    const onSelectReaction = jest.fn();
    const onReply = jest.fn();
    const onCopy = jest.fn();
    const onUnsend = jest.fn();
    renderMenu({}, { onSelectReaction, onReply, onCopy, onUnsend });

    fireEvent.press(screen.getByLabelText('React with 😂'));
    fireEvent.press(screen.getByText('Reply'));
    fireEvent.press(screen.getByText('Copy'));
    fireEvent.press(screen.getByText('Unsend'));

    expect(onSelectReaction).toHaveBeenCalledWith('😂');
    expect(onReply).toHaveBeenCalledTimes(1);
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(onUnsend).toHaveBeenCalledTimes(1);
  });

  it('hides the reaction row when reactions are not allowed', () => {
    renderMenu({ canReact: false });

    expect(screen.queryByLabelText('React with ❤️')).toBeNull();
    expect(screen.getByText('Reply')).toBeTruthy();
  });

  it('disables copy for non-text messages', () => {
    const onCopy = jest.fn();
    renderMenu({ canCopy: false }, { onCopy });

    fireEvent.press(screen.getByText('Copy'));

    expect(onCopy).not.toHaveBeenCalled();
  });

  it('dims unsend when the message cannot be unsent', () => {
    const onUnsend = jest.fn();
    renderMenu({ canUnsend: false }, { onUnsend });

    fireEvent.press(screen.getByText('Unsend'));

    expect(onUnsend).not.toHaveBeenCalled();
  });
});
