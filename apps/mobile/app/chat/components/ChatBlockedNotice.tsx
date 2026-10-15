import { View, Text } from 'react-native'

import { Button } from 'heroui-native'

interface ChatBlockedNoticeProps {
  otherUserName: string;
  /** The current user blocked the other person (otherwise they were blocked). */
  blockedByMe: boolean;
  isUnblocking: boolean;
  onUnblock: () => void;
}

/** Replaces the message box while either person has blocked the other. */
export default function ChatBlockedNotice({
  otherUserName,
  blockedByMe,
  isUnblocking,
  onUnblock,
}: ChatBlockedNoticeProps) {
  return (
    <View
      className='items-center gap-2 rounded-2xl bg-surface px-4 py-3'
      accessibilityLiveRegion='polite'
    >
      <Text className='text-center text-sm text-foreground font-nunitoSemiBold'>
        {blockedByMe ? `You blocked ${otherUserName}` : "You can't reply to this conversation"}
      </Text>
      <Text className='text-center text-xs text-gray-500 font-inter'>
        {blockedByMe
          ? "You can't message each other until you unblock them."
          : 'Messaging is unavailable in this conversation.'}
      </Text>
      {blockedByMe ? (
        <Button size='sm' variant='secondary' onPress={onUnblock} isDisabled={isUnblocking}>
          <Button.Label>{isUnblocking ? 'Unblocking…' : 'Unblock'}</Button.Label>
        </Button>
      ) : null}
    </View>
  )
}
