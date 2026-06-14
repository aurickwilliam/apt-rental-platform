import { View, Text, Image, ActivityIndicator } from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import MessageCard from '@/app/(tabs)/components/chat/MessageCard'

import { SearchField, Tabs, Separator } from 'heroui-native'

import { getRelativeTime } from '@repo/utils'

import { supabase } from '@repo/supabase'

import { getConversations, type Conversation } from '@/service/chatService'

import { EMPTY_STATE_IMAGES } from 'constants/images'

import { useColors } from '@/hooks/useTheme'

type ConversationWithMeta = Conversation & {
  last_sender_is_me?: boolean;
}

function getConversationMetaKey(otherUserId: string, apartmentId: string | null) {
  return `${otherUserId}:${apartmentId ?? 'none'}`;
}

export default function Chat() {
  const router = useRouter();
  const { colors } = useColors();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<'Tenant' | 'Inquiries'>('Tenant');
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

      const { data: tenancyRows, error: tenancyError } = await supabase
        .from('tenancies')
        .select('tenant_id, apartment_id')
        .eq('landlord_id', profile.id)
        .eq('status', 'active');

      if (tenancyError) throw tenancyError;

      const activeTenantConversations = new Set(
        (tenancyRows ?? []).map((row) =>
          getConversationMetaKey(
            row.tenant_id as string,
            (row.apartment_id as string | null) ?? null
          )
        )
      );

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

      const conversationsWithMeta = data.map((conv) => {
        const conversationKey = getConversationMetaKey(
          conv.other_user_id,
          conv.apartment_id
        );

        return {
          ...conv,
          conversation_type: activeTenantConversations.has(conversationKey)
            ? 'tenant'
            : 'inquiry',
          last_sender_is_me:
            lastSenderIsMeByConversation[conversationKey] ?? false,
        };
      });

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
              // If the conversation doesn't exist in the current filtered tab, refresh from backend.
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
  }

  const handleChatPress = (conversation: Conversation) => {
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
      className='p-5'
      scrollable
      bottomPadding={50}
      refreshing={refreshing}
      onRefresh={handleRefresh}
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
            <ActivityIndicator color={colors.primary} />
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
