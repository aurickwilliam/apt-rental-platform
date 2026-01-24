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

  const alignment = isSent ? 'self-end items-end' : 'self-start items-start';
  const bubbleColor = isSent ? 'bg-primary' : 'bg-darkerWhite';
  const textColor = isSent ? 'text-white' : 'text-text';

  return (
    <View className={`max-w-[80%] mb-4 ${alignment}`}>
      {/* Message Bubble */}
      <View 
        className={`px-4 py-3 rounded-2xl ${bubbleColor}`}
      >
        <Text 
          className={`text-base font-inter leading-6 ${textColor}`}
        >
          {message}
        </Text>
      </View>

      {/* Timestamp */}
      <Text className='text-grey-400 text-sm font-inter mt-1'>
        {timestamp}
      </Text>
    </View>
  )
}
