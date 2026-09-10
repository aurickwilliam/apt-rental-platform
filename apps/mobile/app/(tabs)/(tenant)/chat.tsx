import { View, Text, Image } from 'react-native';
import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';

import ScreenWrapper from 'components/layout/ScreenWrapper';
import MessageCard from '@/app/(tabs)/components/chat/MessageCard';

import { EMPTY_STATE_IMAGES } from 'constants/images';

import { getRelativeTime } from '@repo/utils';

import { useConversations } from '@/hooks/chat';
import { useTenancy } from '@/hooks/tenancy';
import { useColors } from '@/hooks/useTheme';
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_BOTTOM_OFFSET } from '@/app/(tabs)/components/CustomTabBar';

import {
  Button,
  SearchField,
  Separator,
  Spinner,
} from 'heroui-native';

export default function Chat() {
  const router = useRouter();

  const { colors } = useColors();

  const [searchQuery, setSearchQuery] = useState('');

  const { tenancy, refreshing: tenancyRefreshing, refetch: refetchTenancy } = useTenancy();
  const {
    conversations,
    loading,
    refreshing: conversationsRefreshing,
    error,
    refetch: refetchConversations,
    markConversationRead,
  } = useConversations('tenant');

  const refreshing = conversationsRefreshing || tenancyRefreshing;

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchConversations(), refetchTenancy()]);
  }, [refetchConversations, refetchTenancy]);

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.other_user_name.toLowerCase().includes(q) ||
      (c.apartment_name ?? '').toLowerCase().includes(q) ||
      (c.last_message ?? '').toLowerCase().includes(q)
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
      scrollable
      className='p-5'
      bottomPadding={FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_BOTTOM_OFFSET}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      <Text className='text-primary text-3xl font-nunitoBold mb-3'>
        Messages
      </Text>

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

      {loading ? (
        <View className='flex-1 items-center justify-center mt-20'>
          <Spinner size="sm" color={colors.primary} />
        </View>
      ) : error ? (
        <View className='flex-1 items-center justify-center'>
          <View className='aspect-square size-64'>
            <Image
              source={EMPTY_STATE_IMAGES.emptyMessage}
              style={{ width: '100%', height: '100%' }}
            />
          </View>
          <Text className='text-2xl text-accent font-nunitoBold mb-2 mt-5'>
            Something went wrong
          </Text>
          <Text className='text-base text-gray-500 font-nunitoSemiBold text-center px-10'>
            {error}
          </Text>
          <Button className='mt-4 bg-primary' onPress={() => void handleRefresh()}>
            <Text className='text-white font-nunitoSemiBold'>Retry</Text>
          </Button>
        </View>
      ) : conversations.length === 0 ? (
        <View className='flex-1 items-center justify-center'>
          <View className='aspect-square size-64'>
            <Image
              source={EMPTY_STATE_IMAGES.emptyMessage}
              style={{ width: '100%', height: '100%' }}
            />
          </View>
          <Text className='text-2xl text-accent font-nunitoBold mb-2 mt-5'>
            No Messages Yet
          </Text>
          <Text className='text-base text-gray-500 font-nunitoSemiBold text-center px-10'>
            Start a conversation with a landlord to see your messages here.
          </Text>
        </View>
      ) : filteredConversations.length === 0 ? (
        <View className='flex-1 items-center justify-center mt-10'>
          <Text className='text-lg text-accent font-nunitoSemiBold mb-2'>
            No results found
          </Text>
          <Text className='text-base text-gray-500 font-nunitoSemiBold text-center px-10'>
            No conversations match &quot;{searchQuery}&quot;. Try a different name, property, or message.
          </Text>
        </View>
      ) : (
        <>
          {/* Current Landlord */}
          {currentLandlordConversation && (
            <View>
              <Separator className='my-3' />

              <Text className='text-base font-nunitoSemiBold text-accent mb-3'>
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
                messageType={currentLandlordConversation.last_message_type}
                isUserLastSender={Boolean(
                  currentLandlordConversation.last_sender_is_me
                )}
                timestamp={getRelativeTime(
                  new Date(currentLandlordConversation.last_message_time)
                )}
                unreadCount={currentLandlordConversation.unread_count}
                profilePictureUrl={currentLandlordConversation.other_user_avatar ?? undefined}
                onPress={() =>
                  handleChatPress(currentLandlordConversation)
                }
              />
            </View>
          )}

          <Separator className='my-3' />

          {/* Other conversations */}
          {otherConversations.length > 0 && (
            <View className='gap-3'>
              <Text className='text-base font-nunitoSemiBold text-gray-500'>
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
                  messageType={conv.last_message_type}
                  isUserLastSender={Boolean(conv.last_sender_is_me)}
                  timestamp={getRelativeTime(
                    new Date(conv.last_message_time)
                  )}
                  unreadCount={conv.unread_count}
                  profilePictureUrl={conv.other_user_avatar ?? undefined}
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