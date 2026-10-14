import { useCallback, useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Gesture-aware list so the rows' swipe actions work on Android.
import { FlatList } from 'react-native-gesture-handler';

import ScreenWrapper from '@/components/layout/ScreenWrapper';
import StandardHeader from '@/components/layout/StandardHeader';
import ConversationListRow from '@/app/(tabs)/components/chat/ConversationListRow';
import ConversationListState from '@/app/(tabs)/components/chat/ConversationListState';
import ConversationActionOverlays from '@/app/(tabs)/components/chat/ConversationActionOverlays';

import { useConversationRowActions, useConversations } from '@/hooks/chat';
import {
  getChatRouteParams,
  toConversationItem,
  type ConversationListItem,
} from '@/service/chat/conversationList';
import type { ConversationRole, ConversationWithMeta } from '@/service/chat/conversationService';

const LIST_PADDING = 20;

function toPortal(value: string | string[] | undefined): ConversationRole {
  const portal = Array.isArray(value) ? value[0] : value;
  return portal === 'landlord' ? 'landlord' : 'tenant';
}

/** Archived conversations of one portal; a new message moves a chat back. */
export default function ArchivedChats() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ portal?: string | string[] }>();
  const portal = toPortal(params.portal);

  // The Messages tab underneath keeps the live channel for this list.
  const {
    conversations,
    loading,
    error,
    refetch,
    markConversationRead,
    updatePreferences,
    setBlocked,
  } = useConversations(portal, { subscribe: false });

  const { rowHandlers, overlays } = useConversationRowActions({
    role: portal,
    markConversationRead,
    updatePreferences,
    setBlocked,
  });

  const items = useMemo<ConversationListItem[]>(
    () =>
      conversations
        .filter((conversation) => conversation.is_archived)
        .map((conversation) => toConversationItem(conversation)),
    [conversations]
  );

  const handleChatPress = useCallback(
    (conversation: ConversationWithMeta) => {
      router.push({ pathname: '/chat/[conversationId]', params: getChatRouteParams(conversation) });
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: ConversationListItem }) => (
      <ConversationListRow item={item} onOpen={handleChatPress} handlers={rowHandlers} />
    ),
    [handleChatPress, rowHandlers]
  );

  const listEmpty = loading ? (
    <ConversationListState variant='loading' />
  ) : error ? (
    <ConversationListState
      variant='illustrated'
      title='Something went wrong'
      description={error}
      actionLabel='Retry'
      onAction={() => void refetch()}
    />
  ) : (
    <ConversationListState
      variant='compact'
      title='No archived chats'
      description='Swipe left on a chat and tap Archive to move it here. A new message brings it back.'
    />
  );

  return (
    <ScreenWrapper
      header={<StandardHeader title='Archived chats' />}
      noBottomPadding
      dismissKeyboardOnTouch={false}
    >
      <FlatList
        data={loading || error ? [] : items}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        ListEmptyComponent={listEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          padding: LIST_PADDING,
          paddingBottom: LIST_PADDING + insets.bottom,
        }}
      />

      <ConversationActionOverlays {...overlays} />
    </ScreenWrapper>
  );
}
