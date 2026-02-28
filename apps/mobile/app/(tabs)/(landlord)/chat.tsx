import { View, Text, Image, TouchableOpacity } from 'react-native'
import { useState } from 'react'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import SearchField from '@/components/inputs/SearchField'
import Divider from '@/components/display/Divider'
import MessageCard from '@/components/display/MessageCard'

import { getRelativeTime } from '@repo/utils'

import { COLORS } from '@repo/constants'
import { EMPTY_STATE_IMAGES } from 'constants/images'

export default function Chat() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<'Tenant' | 'Inquiries'>('Tenant');

  // TODO: Replace with actual logic to determine the number of messages
  const noMessages: number = 2; // Set to 0 to test empty state

  // Dummy data for messages can be added here later
  const messages = [
    {
      id: '1',
      name: 'Shohei Ohtani',
      apartmentName: 'Charles Apartments - Apt 203',
      lastMessage: 'Shibal',
      timestamp: getRelativeTime(new Date(Date.now() - 24 * 60 * 60 * 1000)), // Yesterday
    },
    {
      id: '2',
      name: 'Jane Doe',
      apartmentName: 'Maple Residency - Apt 101',
      lastMessage: 'See you tomorrow!',
      timestamp: getRelativeTime(new Date(Date.now() - 2 * 60 * 60 * 1000)), // 2 hours ago
    },
    {
      id: '3',
      name: 'John Smith',
      apartmentName: 'Oakwood Villas - Apt 305',
      lastMessage: 'Thanks for the update.',
      timestamp: getRelativeTime(new Date(Date.now() - 10 * 60 * 1000)), // 10 minutes ago
    }
  ]

  const handleMessageToggle = (filter: 'Tenant' | 'Inquiries') => {
    setSelectedFilter(filter);

    // TODO: Implement logic to filter messages based on the selected filter (Tenant or Inquiries)
  }

  return (
    <ScreenWrapper
      className='p-5'
      scrollable
      backgroundColor={COLORS.darkerWhite}
      bottomPadding={50}
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
              searchPlaceholder='Search messages'
              onChangeSearch={setSearchQuery}
              searchValue={searchQuery}     
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
              Start a conversation with a tenant to see your messages here.
            </Text>
          </View>
        ) : (
          <>
            <Divider />

            {/* Group Button */}
            <View className='flex-row gap-3'>
              <TouchableOpacity
                className={`rounded-lg py-2 px-4 items-center justify-center ${selectedFilter === 'Tenant' ? 'bg-primary' : 'bg-white'}`}
                activeOpacity={0.7}
                onPress={() => handleMessageToggle('Tenant')}
              >
                <Text className={`text-text text-base font-interMedium ${selectedFilter === 'Tenant' ? 'text-white' : 'text-primary'}`}>
                  Tenants
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`rounded-lg py-2 px-4 items-center justify-center ${selectedFilter === 'Inquiries' ? 'bg-primary' : 'bg-white'}`}
                activeOpacity={0.7}
                onPress={() => handleMessageToggle('Inquiries')}
              >
                <Text className={`text-text text-base font-interMedium ${selectedFilter === 'Inquiries' ? 'text-white' : 'text-primary'}`}>
                  Inquiries
                </Text>
              </TouchableOpacity>
            </View>

            <View className='flex-1 gap-3 mt-3'>
              {/* Render the list of messages */}
              {messages.map((message, index) => (
                <MessageCard 
                  key={index}
                  name={message.name}
                  apartmentName={message.apartmentName}
                  lastMessage={message.lastMessage}
                  timestamp={message.timestamp}
                  onPress={() => {}}
                />
              ))}
            </View>
          </>
        )
      }
    </ScreenWrapper>
  )
}
