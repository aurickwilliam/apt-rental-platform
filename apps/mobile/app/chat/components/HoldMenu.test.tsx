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

// heroui-native ships untranspiled ESM that Jest cannot parse — stub the used
// primitives with real Pressable/View hosts so press and a11y queries work.
jest.mock('heroui-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Pressable, Text, View } = jest.requireActual<typeof import('react-native')>('react-native');
  function Passthrough({ children }: { children?: React.ReactNode }) {
    return React.createElement(View, null, children);
  }
  function ListGroupMock({ children }: { children?: React.ReactNode }) {
    return React.createElement(View, null, children);
  }
  ListGroupMock.Item = function Item({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) {
    return React.createElement(Pressable, props, children);
  };
  ListGroupMock.ItemPrefix = Passthrough;
  ListGroupMock.ItemContent = Passthrough;
  ListGroupMock.ItemTitle = function ItemTitle({ children }: { children?: React.ReactNode }) {
    return React.createElement(Text, null, children);
  };
  return { ListGroup: ListGroupMock, Separator: () => null };
});

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

async function renderMenu(overrides: Partial<HoldMenuData> = {}, handlers = {}) {
  const noop = jest.fn();
  return await render(
    <HoldMenu
      data={{ ...baseData, ...overrides }}
      onReply={noop}
      onCopy={noop}
      onUnsend={noop}
      {...handlers}
    />
  );
}

describe('HoldMenu', () => {
  it('renders the timestamp and all actions, without reactions or the message', async () => {
    await renderMenu();

    // Reactions live in their own pill above the message (HoldStack).
    expect(screen.queryByLabelText('React with ❤️')).toBeNull();
    expect(screen.getByText('Jul 8, 2026 at 7:49 PM')).toBeTruthy();
    expect(screen.getByText('Reply')).toBeTruthy();
    expect(screen.getByText('Copy')).toBeTruthy();
    expect(screen.getByText('Unsend')).toBeTruthy();
  });

  it('fires reply, copy, and unsend', async () => {
    const onReply = jest.fn();
    const onCopy = jest.fn();
    const onUnsend = jest.fn();
    await renderMenu({}, { onReply, onCopy, onUnsend });

    await fireEvent.press(screen.getByText('Reply'));
    await fireEvent.press(screen.getByText('Copy'));
    await fireEvent.press(screen.getByText('Unsend'));

    expect(onReply).toHaveBeenCalledTimes(1);
    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(onUnsend).toHaveBeenCalledTimes(1);
  });

  it('disables copy for non-text messages', async () => {
    const onCopy = jest.fn();
    await renderMenu({ canCopy: false }, { onCopy });

    await fireEvent.press(screen.getByText('Copy'));

    expect(onCopy).not.toHaveBeenCalled();
  });

  it('dims unsend when the message cannot be unsent', async () => {
    const onUnsend = jest.fn();
    await renderMenu({ canUnsend: false }, { onUnsend });

    await fireEvent.press(screen.getByText('Unsend'));

    expect(onUnsend).not.toHaveBeenCalled();
  });
});
