import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useState, useEffect } from 'react'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import SearchField from '@/components/inputs/SearchField'
import Divider from '@/components/display/Divider'
import MessageCard from '@/components/display/MessageCard'

import { getRelativeTime } from '@repo/utils'
import { supabase } from '@repo/supabase'
import { getConversations, type Conversation } from '@/service/chatService'

import { COLORS } from '@repo/constants'
import { EMPTY_STATE_IMAGES } from 'constants/images'

export default function Chat() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<'Tenant' | 'Inquiries'>('Tenant');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  async function fetchConversations() {
    try {
      // Get the current user's row in public.users via user_id (auth uid)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const data = await getConversations(profile.id);
      setConversations(data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.other_user_name.toLowerCase().includes(q) ||
      (c.apartment_name ?? '').toLowerCase().includes(q) ||
      c.last_message.toLowerCase().includes(q);
      
    const matchesType =
      selectedFilter === 'Tenant'
        ? c.conversation_type === 'tenant'
        : c.conversation_type === 'inquiry';

    return matchesSearch && matchesType;
  });

  const handleMessageToggle = (filter: 'Tenant' | 'Inquiries') => {
    setSelectedFilter(filter);

    // TODO: Implement logic to filter messages based on the selected filter (Tenant or Inquiries)
  }

  const handleChatPress = (conversation: Conversation) => {
    router.push({
      pathname: '/chat/[conversationId]',
      params: {
        conversationId: conversation.conversation_key,
        otherUserId: conversation.other_user_id,
        otherUserName: conversation.other_user_name,
        otherUserAvatar: conversation.other_user_avatar ?? '',
        apartmentId: conversation.apartment_id ?? 'none',
      },
    });
  };

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
        conversations.length > 0 && (
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
        loading ? (
          <View className='flex-1 items-center justify-center mt-20'>
            <ActivityIndicator color={COLORS.primary} />
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

            {filteredConversations.length === 0 ? (
              <View className='flex-1 items-center justify-center mt-10'>
                <Text className='text-lg text-primary font-poppinsMedium mb-2'>
                  No {selectedFilter} Messages
                </Text>
                <Text className='text-base text-grey-500 font-poppins text-center px-10'>
                  Try switching filters to view your other conversations.
                </Text>
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
                    timestamp={getRelativeTime(new Date(message.last_message_time))}
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
