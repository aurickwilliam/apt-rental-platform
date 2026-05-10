import { View, Text, Image, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import SearchField from 'components/inputs/SearchField';
import ScreenWrapper from 'components/layout/ScreenWrapper';
import MessageCard from '@/components/cards/MessageCard';
import Divider from 'components/display/Divider';

import { COLORS } from '@repo/constants';
import { EMPTY_STATE_IMAGES } from 'constants/images';

import { getRelativeTime } from '@repo/utils';

import { supabase } from '@repo/supabase';

import { getConversations, type Conversation } from '@/service/chatService';

import { useTenancy } from '@/hooks/useTenancy';

type ConversationWithMeta = Conversation & {
  last_sender_is_me?: boolean;
};

function getConversationMetaKey(otherUserId: string, apartmentId: string | null) {
  return `${otherUserId}:${apartmentId ?? 'none'}`;
}

export default function Chat() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { tenancy } = useTenancy();

  const fetchConversations = useCallback(async () => {
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
      setMyId(profile.id);

      const data = await getConversations(profile.id);

      const { data: chatRows, error: chatError } = await supabase
        .from('chat')
        .select('sender_id, receiver_id, apartment_id, created_at')
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (chatError) throw chatError;

      const lastSenderIsMeByConversation: Record<string, boolean> = {};
      for (const row of (chatRows ?? []) as {
        sender_id: string;
        receiver_id: string;
        apartment_id: string | null;
      }[]) {
        const otherUserId = row.sender_id === profile.id ? row.receiver_id : row.sender_id;
        const key = getConversationMetaKey(otherUserId, row.apartment_id);

        if (!(key in lastSenderIsMeByConversation)) {
          lastSenderIsMeByConversation[key] = row.sender_id === profile.id;
        }
      }

      const conversationsWithMeta = data.map((conv) => ({
        ...conv,
        last_sender_is_me:
          lastSenderIsMeByConversation[
            getConversationMetaKey(conv.other_user_id, conv.apartment_id)
          ] ?? false,
      }));

      setConversations(conversationsWithMeta as ConversationWithMeta[]);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [fetchConversations])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchConversations();
    } finally {
      setRefreshing(false);
    }
  }, [fetchConversations]);

  useEffect(() => {
    if (!myId) return;

    const channel = supabase
      .channel(`chat-list:${myId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat',
        },
        (payload) => {
          const row = payload.new as {
            sender_id: string;
            receiver_id: string;
            apartment_id: string | null;
            message: string;
            created_at: string;
          };

          if (row.sender_id !== myId && row.receiver_id !== myId) return;

          const otherUserId = row.sender_id === myId ? row.receiver_id : row.sender_id;

          setConversations((prev) => {
            const next = [...prev];
            const index = next.findIndex(
              (conv) =>
                conv.other_user_id === otherUserId &&
                (conv.apartment_id ?? null) === (row.apartment_id ?? null)
            );

            if (index === -1) {
              fetchConversations();
              return prev;
            }

            const updated = {
              ...next[index],
              last_message: row.message,
              last_message_time: row.created_at,
              last_sender_is_me: row.sender_id === myId,

              unread_count:
                row.sender_id !== myId
                  ? (next[index].unread_count ?? 0) + 1
                  : next[index].unread_count,
            };

            next.splice(index, 1);
            return [updated, ...next];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConversations, myId]);

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.other_user_name.toLowerCase().includes(q) ||
      (c.apartment_name ?? '').toLowerCase().includes(q) ||
      c.last_message.toLowerCase().includes(q)
    );
  });

  const currentLandlordConversation =
    tenancy?.landlord?.id && tenancy?.apartment?.id
      ? filteredConversations.find(
          (c) =>
            c.other_user_id === tenancy.landlord?.id &&
            c.apartment_id === tenancy.apartment.id
        )
      : null;

  const otherConversations = filteredConversations.filter(
    (c) =>
      c.conversation_key !== currentLandlordConversation?.conversation_key
  );

  const handleChatPress = (conversation: Conversation) => {
    // Optimistically clear the badge before navigating
    setConversations((prev) =>
      prev.map((c) =>
        c.conversation_key === conversation.conversation_key
          ? { ...c, unread_count: 0 }
          : c
      )
    );
    
    router.push({
      pathname: '/chat/[conversationId]',
      params: {
        conversationId: conversation.conversation_key,
        otherUserId: conversation.other_user_id,
        otherUserName: conversation.other_user_name,
        otherUserAvatar: conversation.other_user_avatar ?? '',
        otherUserPhoneNumber: conversation.other_user_phone ?? '',
        apartmentId: conversation.apartment_id ?? '',
      },
    });
  };

  return (
    <ScreenWrapper
      scrollable
      className='p-5'
      backgroundColor={COLORS.darkerWhite}
      bottomPadding={50}
      refreshing={refreshing}
      onRefresh={handleRefresh}
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

          {/* Current Landlord */}
          {currentLandlordConversation && (
            <View>
              <Text className='text-lg font-poppinsMedium text-primary mb-3'>
                Current Landlord
              </Text>

              <MessageCard
                key={currentLandlordConversation.conversation_key}
                name={currentLandlordConversation.other_user_name}
                apartmentName={
                  currentLandlordConversation.apartment_name ??
                  'Unknown Property'
                }
                lastMessage={currentLandlordConversation.last_message}
                isUserLastSender={Boolean(
                  currentLandlordConversation.last_sender_is_me
                )}
                timestamp={getRelativeTime(
                  new Date(currentLandlordConversation.last_message_time)
                )}
                unreadCount={currentLandlordConversation.unread_count}
                onPress={() =>
                  handleChatPress(currentLandlordConversation)
                }
              />
            </View>
          )}

          <Divider />

          {/* Other conversations */}
          {otherConversations.length > 0 && (
            <View className='gap-3'>
              <Text className='text-lg font-poppinsMedium text-grey-500'>
                Past Conversations
              </Text>

              {otherConversations.map((conv) => (
                <MessageCard
                  key={conv.conversation_key}
                  name={conv.other_user_name}
                  apartmentName={
                    conv.apartment_name ?? 'Unknown Property'
                  }
                  lastMessage={conv.last_message}
                  isUserLastSender={Boolean(conv.last_sender_is_me)}
                  timestamp={getRelativeTime(
                    new Date(conv.last_message_time)
                  )}
                  unreadCount={conv.unread_count}
                  onPress={() => handleChatPress(conv)}
                />
              ))}
            </View>
          )}
        </>
      )}
    </ScreenWrapper>
  );
}