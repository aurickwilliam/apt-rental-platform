import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Gesture-aware list pieces: on Android a plain FlatList claims the touch on
// slight vertical drift and cancels the rows' swipe actions.
import { FlatList } from 'react-native-gesture-handler';

import { formatFullName } from '@repo/utils';

import ScreenWrapper from 'components/layout/ScreenWrapper';
import {
  PullToRefreshControl,
  PullToRefreshIndicator,
} from 'components/display/PullToRefresh';
import ConversationListHeader from '@/app/(tabs)/components/chat/ConversationListHeader';
import ConversationListRow from '@/app/(tabs)/components/chat/ConversationListRow';
import ConversationListState from '@/app/(tabs)/components/chat/ConversationListState';
import ConversationActionOverlays from '@/app/(tabs)/components/chat/ConversationActionOverlays';

import { useCurrentUserId } from '@/hooks/auth';
import { useConversationRowActions, useConversations } from '@/hooks/chat';
import { useTenancy } from '@/hooks/tenancy';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { buildConversationKey } from '@/service/chat/chatService';
import {
  buildConversationListItems,
  filterConversations,
  getChatRouteParams,
  groupConversations,
  toConversationItem,
  type ConversationListItem,
} from '@/service/chat/conversationList';
import type { ConversationWithMeta } from '@/service/chat/conversationService';
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_BOTTOM_OFFSET } from '@/app/(tabs)/components/CustomTabBar';

const LIST_HORIZONTAL_PADDING = 20;

type LandlordShortcutItem = Extract<ConversationListItem, { kind: 'landlord-shortcut' }>;

export default function Chat() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');

  const myId = useCurrentUserId();
  const { tenancy, refetch: refetchTenancy } = useTenancy();
  const {
    conversations,
    loading,
    error,
    refetch: refetchConversations,
    markConversationRead,
    updatePreferences,
    setBlocked,
  } = useConversations('tenant');

  const { rowHandlers, overlays } = useConversationRowActions({
    role: 'tenant',
    markConversationRead,
    updatePreferences,
    setBlocked,
  });

  const refreshAll = useCallback(
    () => Promise.all([refetchConversations(), refetchTenancy()]),
    [refetchConversations, refetchTenancy]
  );
  // The spinner shows only for a pull, never for background refetches.
  const { refreshing, onRefresh } = usePullToRefresh(refreshAll);

  const isSearching = searchQuery.trim().length > 0;
  const landlord = tenancy?.landlord ?? null;
  const apartment = tenancy?.apartment ?? null;

  // The current landlord's conversation is always pinned on top.
  const isCurrentLandlordConversation = useCallback(
    (conversation: ConversationWithMeta) =>
      Boolean(landlord?.id && apartment?.id) &&
      conversation.other_user_id === landlord?.id &&
      conversation.apartment_id === apartment?.id,
    [apartment?.id, landlord?.id]
  );

  const items = useMemo<ConversationListItem[]>(() => {
    const filtered = filterConversations(conversations, searchQuery);

    // Search covers archived chats too, so they're listed with the rest.
    const groups = groupConversations(
      isSearching ? filtered.map((c) => ({ ...c, is_archived: false })) : filtered,
      isCurrentLandlordConversation
    );

    const pinned = groups.pinned.map((conversation) =>
      toConversationItem(conversation, isCurrentLandlordConversation(conversation))
    );

    const hasLandlordConversation = conversations.some(isCurrentLandlordConversation);
    if (!isSearching && myId && landlord?.id && apartment?.id && !hasLandlordConversation) {
      pinned.unshift({
        kind: 'landlord-shortcut',
        key: 'landlord-shortcut',
        conversationId: buildConversationKey(myId, landlord.id, apartment.id),
        landlordId: landlord.id,
        landlordName: formatFullName(landlord) || 'Your landlord',
        landlordAvatar: landlord.avatar_url,
        apartmentId: apartment.id,
        apartmentName: apartment.name ?? '',
      });
    }

    return buildConversationListItems({ pinned, others: groups.others });
  }, [apartment, conversations, isCurrentLandlordConversation, isSearching, landlord, myId, searchQuery]);

  // The chat screen marks the conversation read once it's on screen.
  const handleChatPress = useCallback(
    (conversation: ConversationWithMeta) => {
      router.push({ pathname: '/chat/[conversationId]', params: getChatRouteParams(conversation) });
    },
    [router]
  );

  const handleStartLandlordChat = useCallback(
    (shortcut: LandlordShortcutItem) => {
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

  const handleOpenArchived = useCallback(() => {
    router.push({ pathname: '/chat/archived', params: { portal: 'tenant' } });
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: ConversationListItem }) => (
      <ConversationListRow
        item={item}
        onOpen={handleChatPress}
        handlers={rowHandlers}
        onStartLandlordChat={handleStartLandlordChat}
      />
    ),
    [handleChatPress, handleStartLandlordChat, rowHandlers]
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
      <FlatList
        data={loading || error ? [] : items}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        ListHeaderComponent={<>
          <PullToRefreshIndicator refreshing={refreshing} />
          <ConversationListHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            showSearch={conversations.length > 0}
            onOpenArchived={handleOpenArchived}
          />
        </>}
        ListHeaderComponentStyle={{ marginBottom: 8 }}
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
          <PullToRefreshControl onRefresh={onRefresh} />
        }
      />

      <ConversationActionOverlays {...overlays} />
    </ScreenWrapper>
  );
}
