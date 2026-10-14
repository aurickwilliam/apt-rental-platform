import { View, Text, SectionList, RefreshControl } from 'react-native';
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Separator } from 'heroui-native';

import { formatFullName } from '@repo/utils';

import ScreenWrapper from 'components/layout/ScreenWrapper';
import ConversationRow from '@/app/(tabs)/components/chat/ConversationRow';
import ConversationListHeader from '@/app/(tabs)/components/chat/ConversationListHeader';
import ConversationListState from '@/app/(tabs)/components/chat/ConversationListState';
import MessageCard from '@/app/(tabs)/components/chat/MessageCard';

import { useCurrentUserId } from '@/hooks/auth';
import { useConversations } from '@/hooks/chat';
import { useTenancy } from '@/hooks/tenancy';
import { useColors } from '@/hooks/useTheme';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { buildConversationKey } from '@/service/chat/chatService';
import {
  filterConversations,
  getChatRouteParams,
  sortUnreadFirst,
} from '@/service/chat/conversationList';
import type { ConversationWithMeta } from '@/service/chat/conversationService';
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_BOTTOM_OFFSET } from '@/app/(tabs)/components/CustomTabBar';

const LIST_HORIZONTAL_PADDING = 20;

/** Current landlord with no messages yet: a shortcut that starts the chat. */
type LandlordShortcut = {
  conversationId: string;
  landlordId: string;
  landlordName: string;
  landlordAvatar: string | null;
  apartmentId: string;
  apartmentName: string;
};

type ConversationListItem =
  | { kind: 'conversation'; conversation: ConversationWithMeta }
  | { kind: 'landlord-shortcut'; shortcut: LandlordShortcut };

type ConversationSection = {
  key: 'current' | 'others';
  title: string;
  data: ConversationListItem[];
};

export default function Chat() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useColors();

  const [searchQuery, setSearchQuery] = useState('');

  const myId = useCurrentUserId();
  const { tenancy, refetch: refetchTenancy } = useTenancy();
  const {
    conversations,
    loading,
    error,
    refetch: refetchConversations,
    markConversationRead,
  } = useConversations('tenant');

  const refreshAll = useCallback(
    () => Promise.all([refetchConversations(), refetchTenancy()]),
    [refetchConversations, refetchTenancy]
  );
  // The spinner shows only for a pull, never for background refetches.
  const { refreshing, onRefresh } = usePullToRefresh(refreshAll);

  const isSearching = searchQuery.trim().length > 0;
  const landlord = tenancy?.landlord ?? null;
  const apartment = tenancy?.apartment ?? null;

  const isCurrentLandlordConversation = useCallback(
    (conversation: ConversationWithMeta) =>
      Boolean(landlord?.id && apartment?.id) &&
      conversation.other_user_id === landlord?.id &&
      conversation.apartment_id === apartment?.id,
    [apartment?.id, landlord?.id]
  );

  const sections = useMemo<ConversationSection[]>(() => {
    const filtered = filterConversations(conversations, searchQuery);
    const currentLandlordConversation = filtered.find(isCurrentLandlordConversation) ?? null;

    const landlordShortcut: LandlordShortcut | null =
      !isSearching &&
      myId &&
      landlord?.id &&
      apartment?.id &&
      !conversations.some(isCurrentLandlordConversation)
        ? {
            conversationId: buildConversationKey(myId, landlord.id, apartment.id),
            landlordId: landlord.id,
            landlordName: formatFullName(landlord) || 'Your landlord',
            landlordAvatar: landlord.avatar_url,
            apartmentId: apartment.id,
            apartmentName: apartment.name ?? '',
          }
        : null;

    const currentItems: ConversationListItem[] = currentLandlordConversation
      ? [{ kind: 'conversation', conversation: currentLandlordConversation }]
      : landlordShortcut
        ? [{ kind: 'landlord-shortcut', shortcut: landlordShortcut }]
        : [];

    const otherItems: ConversationListItem[] = sortUnreadFirst(
      filtered.filter(
        (conversation) =>
          conversation.conversation_key !== currentLandlordConversation?.conversation_key
      )
    ).map((conversation) => ({ kind: 'conversation', conversation }));

    const nextSections: ConversationSection[] = [];
    if (currentItems.length > 0) {
      nextSections.push({ key: 'current', title: 'Current Landlord', data: currentItems });
    }
    if (otherItems.length > 0) {
      nextSections.push({
        key: 'others',
        title: `Other Conversations (${otherItems.length})`,
        data: otherItems,
      });
    }
    return nextSections;
  }, [apartment, conversations, isCurrentLandlordConversation, isSearching, landlord, myId, searchQuery]);

  const handleMarkRead = useCallback(
    (conversationKey: string) => {
      void markConversationRead(conversationKey);
    },
    [markConversationRead]
  );

  // The chat screen marks the conversation read once it's on screen.
  const handleChatPress = useCallback(
    (conversation: ConversationWithMeta) => {
      router.push({ pathname: '/chat/[conversationId]', params: getChatRouteParams(conversation) });
    },
    [router]
  );

  const handleStartLandlordChat = useCallback(
    (shortcut: LandlordShortcut) => {
      router.push({
        pathname: '/chat/[conversationId]',
        params: {
          conversationId: shortcut.conversationId,
          otherUserId: shortcut.landlordId,
          otherUserName: shortcut.landlordName,
          otherUserAvatar: shortcut.landlordAvatar ?? '',
          apartmentId: shortcut.apartmentId,
          apartmentTitle: shortcut.apartmentName,
        },
      });
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: ConversationListItem }) =>
      item.kind === 'conversation' ? (
        <ConversationRow
          conversation={item.conversation}
          onOpen={handleChatPress}
          onMarkRead={handleMarkRead}
        />
      ) : (
        <View className='-mx-5'>
          <MessageCard
            name={item.shortcut.landlordName}
            apartmentName={item.shortcut.apartmentName}
            lastMessage='Send your landlord a message'
            timestamp=''
            profilePictureUrl={item.shortcut.landlordAvatar ?? undefined}
            onPress={() => handleStartLandlordChat(item.shortcut)}
          />
        </View>
      ),
    [handleChatPress, handleMarkRead, handleStartLandlordChat]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: ConversationSection }) =>
      section.key === 'current' ? (
        <Text className='text-base font-nunitoBold text-accent my-2' accessibilityRole='header'>
          {section.title}
        </Text>
      ) : (
        <View>
          {sections[0]?.key === 'current' && <Separator className='my-3' />}
          <Text className='text-base font-nunitoBold text-gray-500 mb-1' accessibilityRole='header'>
            {section.title}
          </Text>
        </View>
      ),
    [sections]
  );

  const listEmpty = loading ? (
    <ConversationListState variant='loading' />
  ) : error ? (
    <ConversationListState
      variant='illustrated'
      title='Something went wrong'
      description={error}
      actionLabel='Retry'
      onAction={() => void onRefresh()}
    />
  ) : isSearching ? (
    <ConversationListState
      variant='compact'
      title='No results found'
      description={`No conversations match "${searchQuery.trim()}". Try a different name, property, or message.`}
    />
  ) : (
    <ConversationListState
      variant='illustrated'
      title='No Messages Yet'
      description='Start a conversation with a landlord to see your messages here.'
      actionLabel='Browse Apartments'
      onAction={() => router.push('/(tabs)/(tenant)/search')}
    />
  );

  return (
    <ScreenWrapper noBottomPadding dismissKeyboardOnTouch={false}>
      <SectionList
        sections={loading || error ? [] : sections}
        keyExtractor={(item) =>
          item.kind === 'conversation' ? item.conversation.conversation_key : item.shortcut.conversationId
        }
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <ConversationListHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            showSearch={conversations.length > 0}
          />
        }
        ListEmptyComponent={listEmpty}
        keyboardShouldPersistTaps='handled'
        keyboardDismissMode='on-drag'
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: LIST_HORIZONTAL_PADDING,
          paddingHorizontal: LIST_HORIZONTAL_PADDING,
          paddingBottom: FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_BOTTOM_OFFSET + insets.bottom,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </ScreenWrapper>
  );
}
