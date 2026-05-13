import { View, Text } from 'react-native'

import { COLORS } from '@repo/constants';

// TODO: Make this more visually appealing

export default function ChatEmptyState() {
  return (
    <View className="flex-1 items-center justify-center py-6">
      <View className="max-w-[92%] rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
        <Text
          className="text-center text-[14px] font-semibold text-[color:var(--tw-color-primary)]"
          style={{ color: COLORS.primary }}
        >
          No messages yet
        </Text>
        <Text className="mt-1 text-center text-[12px] text-slate-500">
          Say hi to start the conversation.
        </Text>
      </View>
    </View>
  )
}