import { View, Text, Image } from 'react-native'
import type { Icon } from '@tabler/icons-react-native'

import { Button } from 'heroui-native'

import { EMPTY_STATE_IMAGES } from 'constants/images'
import { useColors } from '@/hooks/useTheme'

import ConversationListSkeleton from './ConversationListSkeleton'

type ConversationListStateProps =
  | { variant: 'loading' }
  | {
      variant: 'illustrated';
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
 * full empty/error screen; "compact" is the smaller icon-led message for no search results and
 * the empty archive.
 */
export default function ConversationListState(props: ConversationListStateProps) {
  const { colors } = useColors();

  if (props.variant === 'loading') {
    return <ConversationListSkeleton />;
  }

  const { variant, title, description } = props;
  const isCompact = variant === 'compact';
  const EmptyIcon = variant === 'compact' ? props.icon : undefined;
  const actionLabel = variant === 'illustrated' ? props.actionLabel : undefined;
  const onAction = variant === 'illustrated' ? props.onAction : undefined;

  return (
    <View className={`flex-1 items-center justify-center ${isCompact ? 'mt-10' : ''}`}>
      {EmptyIcon ? (
        <View className='mb-3 rounded-full bg-surface-secondary p-4'>
          <EmptyIcon size={44} color={colors.primary} />
        </View>
      ) : (
        <View className='aspect-square size-64'>
          <Image
            source={EMPTY_STATE_IMAGES.emptyMessage}
            style={{ width: '100%', height: '100%' }}
            accessibilityIgnoresInvertColors
          />
        </View>
      )}

      <Text
        className={
          isCompact
            ? 'text-lg text-accent font-nunitoSemiBold mb-2'
            : 'text-2xl text-accent font-nunitoBold mb-2 mt-5'
        }
      >
        {title}
      </Text>
      <Text className='text-base text-gray-500 font-nunitoSemiBold text-center px-10'>
        {description}
      </Text>

      {actionLabel && onAction && (
        <Button className='mt-4 bg-primary' onPress={onAction}>
          <Button.Label>{actionLabel}</Button.Label>
        </Button>
      )}
    </View>
  );
}
