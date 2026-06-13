import { View, Text } from 'react-native'

interface ChatBubbleProps {
  message: string;
  timestamp: string;
  isSent?: boolean;
}

export default function ChatBubble({
  message,
  timestamp,
  isSent = false,
}: ChatBubbleProps) {

  // User | Sender
  const alignment = isSent ? 'self-end items-end' : 'self-start items-start';
  const bubbleColor = isSent ? 'bg-accent' : 'bg-surface-tertiary';
  const textColor = isSent ? 'text-white' : 'text-foreground';

  return (
    <View className={`max-w-[80%] mb-4 ${alignment}`}>
      {/* Message Bubble */}
      <View 
        className={`px-3 py-2 rounded-full ${bubbleColor}`}
      >
        <Text 
          className={`text-sm font-inter leading-6 ${textColor}`}
        >
          {message}
        </Text>
      </View>

      {/* Timestamp */}
      <Text className='text-gray-300 text-xs font-inter mt-1'>
        {timestamp}
      </Text>
    </View>
  )
}
