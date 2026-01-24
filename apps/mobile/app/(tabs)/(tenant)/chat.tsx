import { View, Text, Image } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'

import SearchField from 'components/inputs/SearchField'
import ScreenWrapper from 'components/layout/ScreenWrapper'
import MessageCard from 'components/display/MessageCard';
import Divider from 'components/display/Divider';

import { COLORS } from 'constants/colors';
import { EMPTY_STATE_IMAGES } from 'constants/images';

export default function Chat() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState<string>('');

  const hasCurrentOwner: boolean = false;
  const noMessages: number = 2; // Set to 0 to test empty state

  // Dummy data for messages can be added here later
  const messages = [
    {
      id: '1',
      name: 'Shohei Ohtani',
      apartmentName: 'Charles Apartments - Apt 203',
      lastMessage: 'Shibal',
      timestamp: 'Yesterday',
    },
    {
      id: '2',
      name: 'Jane Doe',
      apartmentName: 'Maple Residency - Apt 101',
      lastMessage: 'See you tomorrow!',
      timestamp: '2 hours ago',
    },
    {
      id: '3',
      name: 'John Smith',
      apartmentName: 'Oakwood Villas - Apt 305',
      lastMessage: 'Thanks for the update.',
      timestamp: '10 minutes ago',
    }
  ]

  const handleChatPress = (conversationId: string) => {
    router.push(`/chat/${conversationId}`);
  }

  return (
    <ScreenWrapper 
      scrollable 
      hasInput
      className='p-5'
      backgroundColor={COLORS.darkerWhite}
    >
      {/* Title Messages */}
      <Text className='text-primary text-5xl font-dmserif leading-[54px]'>
        Messages
      </Text>

      {/* Search Box */}
      {
        noMessages > 0 && (
          <View className='mt-3'>
            <SearchField 
              onChangeSearch={setSearchQuery}
              searchValue={searchQuery}     
            />
          </View>
        )
      }

      {/* If the user has a current owner and is renting */}
      {
        hasCurrentOwner && (
          <View className='mt-5'>
            <Text className='text-lg text-text font-poppinsMedium mb-3'>
              Your Current Landlord
            </Text>

            <MessageCard 
              name='Jonathan Ma'
              apartmentName='Pinecrest Towers - Apt 404'
              lastMessage='Contact your property manager for any inquiries.'
              timestamp='10 mins ago'
              />
          </View>
        )
      }

      {/* List of Messages */}
      {
        noMessages === 0 ? (
          <View className='flex-1 items-center justify-center'>
            {/* Empty State Illustration */}
            <View className='aspect-square size-64'>
              <Image 
                source={EMPTY_STATE_IMAGES.emptyMessage}
                style={{
                  width: '100%',
                  height: '100%',
                }}
              />
            </View>

            <Text className='text-2xl text-primary font-poppinsMedium mb-2 mt-5'>
              No Messages Yet
            </Text>
            <Text className='text-base text-grey-500 font-poppins text-center px-10'>
              Start a conversation with a landlord to see your messages here.
            </Text>
          </View>
        ) : (
          <>
            <Divider />

            <View className='flex-1 gap-3'>
              {hasCurrentOwner && (
                <Text className='text-lg text-text font-poppinsMedium'>
                  Other Conversations
                </Text>
              )}

              {/* Render the list of messages */}
              {messages.map((message, index) => (
                <MessageCard 
                  key={index}
                  name={message.name}
                  apartmentName={message.apartmentName}
                  lastMessage={message.lastMessage}
                  timestamp={message.timestamp}
                  onPress={() => handleChatPress(message.id)}
                />
              ))}
            </View>
          </>
        )
      }
    </ScreenWrapper>
  )
}
