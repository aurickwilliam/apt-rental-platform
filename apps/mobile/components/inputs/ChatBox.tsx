import { View, TextInput, TouchableOpacity } from 'react-native'
import { useState } from 'react'

import { COLORS } from 'constants/colors';

import {
  IconArrowUp
} from '@tabler/icons-react-native';

interface ChatBoxProps {
  chatValue: string;
  onChatValueChange: (text: string) => void;
  isDisabled?: boolean;
  chatPlaceholder?: string;
  onSendPress?: () => void;
}

export default function ChatBox({
  chatValue,
  onChatValueChange,
  isDisabled = false,
  chatPlaceholder = "Type a message...",
  onSendPress,
}: ChatBoxProps) {

  const [isFocused, setIsFocused] = useState<boolean>(false);

  const borderColor = isFocused ? 'border-primary' : 'border-grey-300';

  // TODO: Multiple lines for the Text Input

  return (
    <View className={`px-5 flex-row items-center justify-between gap-3`}>
      <View className={`flex-1 bg-white p-4 rounded-full border-2 ${borderColor}`}>
        <TextInput
          value={chatValue}
          numberOfLines={1}
          editable={!isDisabled}
          onChangeText={onChatValueChange}
  
          style={{
            flex: 1,
            height: '100%',
            paddingVertical: 0,
            color: isDisabled ? COLORS.mediumGrey : COLORS.text,
  
            fontFamily: 'Inter_24pt-Regular',
            fontSize: 16,
            lineHeight: 20,
          }}
          placeholder={chatPlaceholder}
          placeholderTextColor={COLORS.grey}
  
          onFocus={() => {
            setIsFocused(true);
          }}
          // When the user taps out of the input field
          onBlur={() => {
            setIsFocused(false);
          }}
        />
      </View>

      {/* Send Button */}
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={onSendPress}
        className='bg-secondary p-4 rounded-full'
      >
        <IconArrowUp 
        size={26} 
        color={COLORS.white} 
      />
      </TouchableOpacity>
    </View>
  )
}