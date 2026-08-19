import { View, Text } from 'react-native'
import { Avatar } from 'heroui-native'
import { getInitials } from '@repo/utils'

interface ChatEmptyStateProps {
  otherUserName?: string
  otherUserAvatar?: string
  apartmentTitle?: string
  hasMessages?: boolean
}

export default function ChatEmptyState({
  otherUserName,
  otherUserAvatar,
  apartmentTitle,
  hasMessages,
}: ChatEmptyStateProps) {
  return (
    <View className="items-center px-6 pb-4">
      <Avatar
        size="lg"
        color="accent"
        className="size-28 border-4 border-border mb-3"
        alt={otherUserName}
      >
        {otherUserAvatar ? (
          <Avatar.Image source={{ uri: otherUserAvatar }} />
        ) : null}
        <Avatar.Fallback delayMs={200} className="justify-center items-center">
          <Text className="text-accent text-4xl font-nunitoSemiBold leading-none">
            {otherUserName ? getInitials(otherUserName) : '?'}
          </Text>
        </Avatar.Fallback>
      </Avatar>

      {otherUserName && (
        <Text className="text-foreground text-xl font-nunitoBold mb-1">
          {otherUserName}
        </Text>
      )}

      {apartmentTitle && (
        <Text className="text-center text-[14px] text-muted mb-4">
          {apartmentTitle}
        </Text>
      )}

      {!hasMessages && (
        <Text className="text-center text-[13px] text-muted leading-5">
          No messages yet{otherUserName ? ` — send a message to start chatting.` : '.'}
        </Text>
      )}
    </View>
  )
}
