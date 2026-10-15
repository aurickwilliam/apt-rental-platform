import { View, Text, Image } from 'react-native'

import { Button } from 'heroui-native'

import { EMPTY_STATE_IMAGES } from 'constants/images'

import ConversationListSkeleton from './ConversationListSkeleton'

type ConversationListStateProps =
  | { variant: 'loading' }
  | {
      variant: 'illustrated' | 'compact';
      title: string;
      description: string;
      actionLabel?: string;
      onAction?: () => void;
    };

/**
 * Loading (row skeletons), error and empty states for the Messages lists. "illustrated" is the
 * full empty/error screen; "compact" is the no-search-results message.
 */
export default function ConversationListState(props: ConversationListStateProps) {
  if (props.variant === 'loading') {
    return <ConversationListSkeleton />;
  }

  const { variant, title, description, actionLabel, onAction } = props;
  const isCompact = variant === 'compact';

  return (
    <View className={`flex-1 items-center justify-center ${isCompact ? 'mt-10' : ''}`}>
      {!isCompact && (
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
