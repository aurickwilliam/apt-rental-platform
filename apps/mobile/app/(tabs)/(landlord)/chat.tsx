import { View, Text, Image } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import MessageCard from '@/app/(tabs)/components/chat/MessageCard'

import { SearchField, Tabs, Separator, Spinner } from 'heroui-native'

import { getRelativeTime } from '@repo/utils'

import { EMPTY_STATE_IMAGES } from 'constants/images'

import { useConversations } from '@/hooks/chat'
import { useColors } from '@/hooks/useTheme'
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_BOTTOM_OFFSET } from '@/app/(tabs)/components/CustomTabBar'

export default function Chat() {
  const router = useRouter();
  const { colors } = useColors();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<'Tenant' | 'Inquiries'>('Tenant');

  const { conversations, loading, refreshing, refetch, markConversationRead } =
    useConversations('landlord');

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.other_user_name.toLowerCase().includes(q) ||
      (c.apartment_name ?? '').toLowerCase().includes(q) ||
      (c.last_message ?? '').toLowerCase().includes(q);

    const matchesType =
      selectedFilter === 'Tenant'
        ? c.conversation_type === 'tenant'
        : c.conversation_type === 'inquiry';

    return matchesSearch && matchesType;
  });

  const handleMessageToggle = (filter: 'Tenant' | 'Inquiries') => {
    setSelectedFilter(filter);
  }

  const handleChatPress = (conversation: (typeof conversations)[number]) => {
    // Optimistically clear the badge before navigating
    markConversationRead(conversation.conversation_key);

    router.push({
      pathname: '/chat/[conversationId]',
      params: {
        conversationId: conversation.conversation_key,
        otherUserId: conversation.other_user_id,
        otherUserName: conversation.other_user_name,
        otherUserAvatar: conversation.other_user_avatar ?? '',
        otherUserPhoneNumber: conversation.other_user_phone ?? '',
        apartmentId: conversation.apartment_id ?? '',
        apartmentTitle: conversation.apartment_name ?? '',
      },
    });
  };

  return (
    <ScreenWrapper
      className='p-5'
      scrollable
      bottomPadding={FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_BOTTOM_OFFSET}
      refreshing={refreshing}
      onRefresh={refetch}
    >
      {/* Title Messages */}
      <Text className='text-primary text-3xl font-nunitoSemiBold mb-3'>
        Messages
      </Text>

      {/* Search Box */}
      {conversations.length > 0 && (
        <View className='mt-3'>
          <SearchField value={searchQuery} onChange={setSearchQuery}>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input 
                placeholder='Search messages...' 
                className='flex-1 shadow-none'
              />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </View>
      )}

      {/* List of Messages */}
      {
        loading ? (
          <View className='flex-1 items-center justify-center mt-20'>
            <Spinner size="sm" color={colors.primary} />
          </View>
        ) : conversations.length === 0 ? (
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

            <Text className='text-2xl text-accent font-interSemiBold mb-2 mt-5'>
              No Messages Yet
            </Text>
            <Text className='text-base text-gray-500 font-interSemiBold text-center px-10'>
              Start a conversation with a tenant to see your messages here.
            </Text>
          </View>
        ) : (
          <>
            <Separator className="my-4" />

            {/* Group Button */}
            <Tabs
              value={selectedFilter}
              onValueChange={(value) => handleMessageToggle(value as 'Tenant' | 'Inquiries')}
              variant="primary"
            >
              <Tabs.List className="w-full">
                <Tabs.Indicator />
                <Tabs.Trigger value="Tenant" className="w-1/2">
                  {({ isSelected }) => (
                      <Tabs.Label
                          style={{ color: isSelected ? colors.primary : colors.gray500 }}
                      >
                        Tenant
                      </Tabs.Label>
                  )}
                </Tabs.Trigger>

                <Tabs.Trigger value="Inquiries" className="flex-1">
                  {({ isSelected }) => (
                      <Tabs.Label
                          style={{ color: isSelected ? colors.primary : colors.gray500 }}
                      >
                        Inquiries
                      </Tabs.Label>
                  )}
                </Tabs.Trigger>
              </Tabs.List>
            </Tabs>

            {filteredConversations.length === 0 ? (
              <View className='flex-1 items-center justify-center mt-10'>
                {searchQuery.trim().length > 0 ? (
                  <>
                    <Text className='text-lg text-accent font-interSemiBold mb-2'>
                      No results found
                    </Text>
                    <Text className='text-base text-gray-500 font-interSemiBold text-center px-10'>
                      No conversations match &quot;{searchQuery}&quot;. Try a different name, property, or message.
                    </Text>
                  </>
                ) : (
                  <>
                    <Text className='text-lg text-accent font-interSemiBold mb-2'>
                      No {selectedFilter} Messages
                    </Text>
                    <Text className='text-base text-gray-500 font-interSemiBold text-center px-10'>
                      Try switching filters to view your other conversations.
                    </Text>
                  </>
                )}
              </View>
            ) : (
              <View className='flex-1 gap-3 mt-3'>
                {/* Render the list of messages */}
                {filteredConversations.map((message) => (
                  <MessageCard 
                    key={message.conversation_key}
                    name={message.other_user_name}
                    apartmentName={message.apartment_name ?? 'Unknown Property'}
                    lastMessage={message.last_message}
                    messageType={message.last_message_type}
                    isUserLastSender={Boolean(message.last_sender_is_me)}
                    timestamp={getRelativeTime(new Date(message.last_message_time))}
                    unreadCount={message.unread_count} 
                    profilePictureUrl={message.other_user_avatar ?? undefined}
                    onPress={() => handleChatPress(message)}
                  />
                ))}
              </View>
            )}
          </>
        )
      }
    </ScreenWrapper>
  )
}