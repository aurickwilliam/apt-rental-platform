import { fireEvent, render, screen } from '@testing-library/react-native';

import ConversationMoreSheet from './ConversationMoreSheet';

import type { ConversationWithMeta } from '@/service/chat/conversationService';
import { DEFAULT_CONVERSATION_PREFERENCES } from '@/service/chat/conversationPreferences';

jest.mock('@/hooks/useTheme', () => ({
  useColors: () => ({ colors: { danger: '#E50914', textPrimary: '#333333' } }),
}));

jest.mock('@tabler/icons-react-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { View } = jest.requireActual<typeof import('react-native')>('react-native');
  function MockIcon() {
    return React.createElement(View);
  }
  return {
    IconArchive: MockIcon,
    IconArchiveOff: MockIcon,
    IconBan: MockIcon,
    IconBell: MockIcon,
    IconBellOff: MockIcon,
    IconBuilding: MockIcon,
    IconFlag: MockIcon,
    IconMail: MockIcon,
    IconMailOpened: MockIcon,
    IconPin: MockIcon,
    IconPinnedOff: MockIcon,
    IconUser: MockIcon,
  };
});

jest.mock('heroui-native', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const { Pressable, View } = jest.requireActual<typeof import('react-native')>('react-native');

  function Container({ children }: { children: React.ReactNode }) {
    return React.createElement(View, null, children);
  }
  function BottomSheetMock({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) {
    return isOpen ? React.createElement(View, null, children) : null;
  }
  BottomSheetMock.Portal = Container;
  BottomSheetMock.Content = Container;
  BottomSheetMock.Overlay = function Overlay() {
    return null;
  };

  function PressableFeedbackMock({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) {
    return React.createElement(Pressable, props, children);
  }
  PressableFeedbackMock.Highlight = function Highlight() {
    return null;
  };

  return { BottomSheet: BottomSheetMock, PressableFeedback: PressableFeedbackMock };
});

const conversation: ConversationWithMeta = {
  conversation_key: 'user-9:apt-9',
  other_user_id: 'user-9',
  other_user_name: 'Ben Cruz',
  other_user_avatar: null,
  other_user_phone: null,
  apartment_id: 'apt-9',
  apartment_name: 'Harbor View',
  last_message: 'Is parking included?',
  last_message_type: 'text',
  last_message_time: '2026-01-01T00:00:00Z',
  unread_count: 0,
  last_sender_id: null,
  last_sender_is_me: false,
  conversation_type: 'inquiry',
  ...DEFAULT_CONVERSATION_PREFERENCES,
};

it('shows only the options without the name or apartment header, keeping all actions', () => {
  const onSelect = jest.fn();
  render(
    <ConversationMoreSheet
      conversation={conversation}
      isOpen
      onOpenChange={jest.fn()}
      onSelect={onSelect}
    />
  );

  expect(screen.queryByText('Ben Cruz')).toBeNull();
  expect(screen.queryByText('Harbor View')).toBeNull();
  expect(screen.getAllByRole('button').map((button) => button.props.accessibilityLabel)).toEqual([
    'Pin',
    'Archive',
    'Mark as unread',
    'View profile',
    'View apartment',
    'Mute notifications',
    'Report Ben',
    'Block Ben',
  ]);

  fireEvent.press(screen.getByRole('button', { name: 'View apartment' }));
  expect(onSelect).toHaveBeenCalledWith('viewApartment', conversation);
});

it('runs Pin and Archive from the sheet', () => {
  const onSelect = jest.fn();
  render(
    <ConversationMoreSheet conversation={conversation} isOpen onOpenChange={jest.fn()} onSelect={onSelect} />
  );

  fireEvent.press(screen.getByRole('button', { name: 'Pin' }));
  fireEvent.press(screen.getByRole('button', { name: 'Archive' }));

  expect(onSelect).toHaveBeenNthCalledWith(1, 'togglePin', conversation);
  expect(onSelect).toHaveBeenNthCalledWith(2, 'toggleArchive', conversation);
});

it('disables Unpin and Archive for the always-pinned landlord chat', () => {
  render(
    <ConversationMoreSheet
      conversation={conversation}
      isOpen
      isPinLocked
      onOpenChange={jest.fn()}
      onSelect={jest.fn()}
    />
  );

  expect(screen.getByRole('button', { name: 'Unpin' }).props.accessibilityState).toEqual({ disabled: true });
  expect(screen.getByRole('button', { name: 'Archive' }).props.accessibilityState).toEqual({ disabled: true });
  expect(screen.getByRole('button', { name: 'Mark as unread' }).props.accessibilityState).toEqual({ disabled: false });
});
