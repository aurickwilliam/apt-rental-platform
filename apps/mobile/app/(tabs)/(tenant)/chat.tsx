import { View, Text, Image, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';

import SearchField from 'components/inputs/SearchField';
import ScreenWrapper from 'components/layout/ScreenWrapper';
import MessageCard from 'components/display/MessageCard';
import Divider from 'components/display/Divider';

import { COLORS } from '@repo/constants';
import { EMPTY_STATE_IMAGES } from 'constants/images';
import { getRelativeTime } from '@repo/utils';
import { supabase } from '@repo/supabase';
import { getConversations, type Conversation } from '@/service/chatService';

export default function Chat() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
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
    return (
      c.other_user_name.toLowerCase().includes(q) ||
      (c.apartment_name ?? '').toLowerCase().includes(q) ||
      c.last_message.toLowerCase().includes(q)
    );
  });

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
      scrollable
      className='p-5'
      backgroundColor={COLORS.darkerWhite}
      bottomPadding={50}
    >
      <Text className='text-primary text-5xl font-dmserif leading-[54px]'>
        Messages
      </Text>

      {conversations.length > 0 && (
        <View className='mt-3'>
          <SearchField
            onChangeSearch={setSearchQuery}
            searchValue={searchQuery}
          />
        </View>
      )}

      {loading ? (
        <View className='flex-1 items-center justify-center mt-20'>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : filteredConversations.length === 0 ? (
        <View className='flex-1 items-center justify-center'>
          <View className='aspect-square size-64'>
            <Image
              source={EMPTY_STATE_IMAGES.emptyMessage}
              style={{ width: '100%', height: '100%' }}
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
            {filteredConversations.map((conv) => (
              <MessageCard
                key={conv.conversation_key}
                name={conv.other_user_name}
                apartmentName={conv.apartment_name ?? 'Unknown Property'}
                lastMessage={conv.last_message}
                timestamp={getRelativeTime(new Date(conv.last_message_time))}
                // Pass unread_count if your MessageCard supports a badge
                // unreadCount={conv.unread_count}
                onPress={() => handleChatPress(conv)}
              />
            ))}
          </View>
        </>
      )}
    </ScreenWrapper>
  );
}