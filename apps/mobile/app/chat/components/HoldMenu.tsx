import { Text } from 'react-native';

import { ListGroup, Separator } from 'heroui-native';

import {
  IconArrowBackUp,
  IconCopy,
  IconTrash,
  type Icon,
} from '@tabler/icons-react-native';

import { useColors } from '@/hooks/useTheme';

export interface HoldMenuData {
  /** Used by the separate reaction pill, not by this card. */
  myReaction?: string;
  dateLabel: string;
  canReact: boolean;
  canCopy: boolean;
  canUnsend: boolean;
}

interface HoldMenuProps {
  data: HoldMenuData;
  onReply: () => void;
  onCopy: () => void;
  onUnsend: () => void;
}

interface HoldAction {
  key: string;
  label: string;
  accessibilityLabel: string;
  icon: Icon;
  onPress: () => void;
  isDisabled?: boolean;
  isDestructive?: boolean;
}

const ICON_SIZE = 22;

/**
 * Actions card shown below a held message (HeroUI `ListGroup`): timestamp,
 * then Reply / Copy / Unsend. The reactions are a separate pill above the
 * message (see HoldStack), and the message itself is rendered separately
 * above the backdrop.
 */
export default function HoldMenu({ data, onReply, onCopy, onUnsend }: HoldMenuProps) {
  const { colors } = useColors();

  const actions: HoldAction[] = [
    {
      key: 'reply',
      label: 'Reply',
      accessibilityLabel: 'Reply to message',
      icon: IconArrowBackUp,
      onPress: onReply,
    },
    {
      key: 'copy',
      label: 'Copy',
      accessibilityLabel: 'Copy message',
      icon: IconCopy,
      onPress: onCopy,
      isDisabled: !data.canCopy,
    },
    {
      key: 'unsend',
      label: 'Unsend',
      accessibilityLabel: 'Unsend message',
      icon: IconTrash,
      onPress: onUnsend,
      isDisabled: !data.canUnsend,
      isDestructive: true,
    },
  ];

  return (
    <ListGroup className="min-w-56 border border-border pb-1 shadow-lg">
      <Text className="px-4 pt-3 pb-2 text-center text-[13px] font-inter text-gray-500">
        {data.dateLabel || 'Just now'}
      </Text>
      <Separator className="mx-4 mb-1" />

      {actions.map((action) => {
        const isActiveDestructive = action.isDestructive && !action.isDisabled;
        const iconColor = action.isDisabled
          ? colors.gray400
          : isActiveDestructive
            ? colors.danger
            : colors.textPrimary;

        return (
          <ListGroup.Item
            key={action.key}
            onPress={action.isDisabled ? undefined : action.onPress}
            disabled={action.isDisabled}
            accessibilityRole="button"
            accessibilityLabel={action.accessibilityLabel}
            accessibilityState={{ disabled: Boolean(action.isDisabled) }}
            className={`py-2.5 ${action.isDisabled ? 'opacity-40' : ''}`}
          >
            <ListGroup.ItemPrefix>
              <action.icon size={ICON_SIZE} color={iconColor} />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle
                className={`font-inter ${isActiveDestructive ? 'text-danger' : ''}`}
              >
                {action.label}
              </ListGroup.ItemTitle>
            </ListGroup.ItemContent>
          </ListGroup.Item>
        );
      })}
    </ListGroup>
  );
}
