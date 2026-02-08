import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useState } from 'react';

import ScreenWrapper from 'components/layout/ScreenWrapper'
import ChatHeader from 'components/layout/ChatHeader';
import ChatBubble from 'components/display/ChatBubble';
import ChatBox from 'components/inputs/ChatBox';

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
    {
      id: '4',
      message: 'Can I get a copy of my lease agreement?',
      timestamp: '10:07 AM',
      isSent: true,
    },
    {
      id: '5',
      message: 'Yes, I will send it to your email shortly.',
      timestamp: '10:10 AM',
      isSent: false,
    },
    {
      id: '6',
      message: 'Thank you!',
      timestamp: '10:12 AM',
      isSent: true,
    },
    {
      id: '7',
      message: 'You\'re welcome! If you have any more questions, feel free to ask.',
      timestamp: '10:15 AM',
      isSent: false,
    },
    {
      id: '8',
      message: 'Will do, thanks again!',
      timestamp: '10:20 AM',
      isSent: true,
    },
    {
      id: '9',
      message: 'Have a great day!',
      timestamp: '10:25 AM',
      isSent: false,
    },
    {
      id: '10',
      message: 'You too!',
      timestamp: '10:30 AM',
      isSent: true,
    },
    {
      id: '11',
      message: 'Goodbye!',
      timestamp: '10:35 AM',
      isSent: false,
    }
  ]

  return (
    <ScreenWrapper
      header={
        <ChatHeader name={`Conversation ${conversationId}`}/>
      }
    >
      <ScrollView         
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          padding: 16,
          flexGrow: 1,
        }}
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

      <KeyboardAvoidingView
        behavior={'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 100}
      >
        <View className='bg-white flex items-center justify-center py-3'>
          <ChatBox 
            chatValue={chatMessage}
            onChatValueChange={setChatMessage}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  )
}