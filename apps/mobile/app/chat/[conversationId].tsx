import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useLocalSearchParams } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import ChatHeader from 'components/layout/ChatHeader';
import ChatBubble from 'components/display/ChatBubble';
import ChatBox from 'components/inputs/ChatBox';

import { COLORS } from 'constants/colors';
import { useState } from 'react';

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();

  const [chatMessage, setChatMessage] = useState<string>('');

  // Dummy data for chat messages can be added here later
  const messages = [
    {
      id: '1',
      message: 'Hello! How can I help you today?',
      timestamp: '10:00 AM',
      isSent: false,
    },
    {
      id: '2',
      message: 'I have a question about my lease agreement.',
      timestamp: '10:02 AM',
      isSent: true,
    },
    {
      id: '3',
      message: 'Sure, please go ahead and ask your question.',
      timestamp: '10:05 AM',
      isSent: false,
    },
  ]

  return (
    <ScreenWrapper 
      header={
        <ChatHeader 
          name={`Conversation ${conversationId}`}
        />
      }
      headerBackgroundColor={COLORS.primary}
      hasBottomPadding={false}
    >
      <KeyboardAvoidingView 
        behavior={'padding'}
        className='flex-1'
        keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 110}
      >
        <ScrollView 
          className='flex-1 mt-5 mx-5'
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {
            messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg.message} 
                timestamp={msg.timestamp}
                isSent={msg.isSent}
              />
            ))
          }
        </ScrollView>

        {/* Input Text Field */}
        <View className='bg-white flex items-center justify-center py-5'>
          <ChatBox 
            chatValue={chatMessage}
            onChatValueChange={setChatMessage}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  )
}