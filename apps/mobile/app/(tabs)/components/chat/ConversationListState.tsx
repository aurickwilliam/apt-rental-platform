import type { Icon } from '@tabler/icons-react-native'
import { IconMessages } from '@tabler/icons-react-native'

import { Button } from 'heroui-native'

import EmptyState from '@/components/display/EmptyState'

import ConversationListSkeleton from './ConversationListSkeleton'

type ConversationListStateProps =
  | { variant: 'loading' }
  | {
      variant: 'illustrated';
      icon?: Icon;
      title: string;
      description: string;
      actionLabel?: string;
      onAction?: () => void;
    }
  | {
      variant: 'compact';
      icon: Icon;
      title: string;
      description: string;
    };

/**
 * Loading (row skeletons), error and empty states for the Messages lists. "illustrated" is the
 * full empty/error screen (with an optional small action); "compact" is the icon-led message for
 * no search results and the empty archive. Both render the shared EmptyState.
 */
export default function ConversationListState(props: ConversationListStateProps) {
  if (props.variant === 'loading') {
    return <ConversationListSkeleton />;
  }

  const { title, description } = props;
  const isCompact = props.variant === 'compact';
  const icon = props.icon ?? IconMessages;
  const actionLabel = props.variant === 'illustrated' ? props.actionLabel : undefined;
  const onAction = props.variant === 'illustrated' ? props.onAction : undefined;

  return (
    <EmptyState
      className={`flex-1 ${isCompact ? 'mt-10' : ''}`}
      icon={icon}
      title={title}
      description={description}
      action={
        actionLabel && onAction ? (
          <Button size='sm' onPress={onAction}>
            <Button.Label>{actionLabel}</Button.Label>
          </Button>
        ) : undefined
      }
    />
  );
}
