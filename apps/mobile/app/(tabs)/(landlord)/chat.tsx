import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
// Gesture-aware list pieces: on Android a plain FlatList claims the touch on
// slight vertical drift and cancels the rows' swipe actions.
import { FlatList } from 'react-native-gesture-handler'

import { Tabs } from 'heroui-native'
import { IconMessageQuestion, IconUsers } from '@tabler/icons-react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import {
  PullToRefreshControl,
  PullToRefreshIndicator,
} from '@/components/display/PullToRefresh'
import EmptyState from '@/components/display/EmptyState'
import ConversationListHeader from '@/app/(tabs)/components/chat/ConversationListHeader'
import ConversationListRow from '@/app/(tabs)/components/chat/ConversationListRow'
import ConversationListState from '@/app/(tabs)/components/chat/ConversationListState'
import ConversationActionOverlays from '@/app/(tabs)/components/chat/ConversationActionOverlays'

import { useColors } from '@/hooks/useTheme'
import { useConversationRowActions, useConversations } from '@/hooks/chat'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import {
  buildConversationListItems,
  filterConversations,
  getChatRouteParams,
  groupConversations,
  toConversationItem,
  type ConversationListItem,
} from '@/service/chat/conversationList'
import type { ConversationWithMeta } from '@/service/chat/conversationService'
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_BOTTOM_OFFSET } from '@/app/(tabs)/components/CustomTabBar'

const LIST_HORIZONTAL_PADDING = 20;

type ConversationFilter = 'Tenant' | 'Inquiries';

const FILTER_EMPTY_STATES: Record<
  ConversationFilter,
  { icon: typeof IconUsers; title: string; description: string }
> = {
  Tenant: {
    icon: IconUsers,
    title: 'No Tenant Conversations',
    description: 'Messages with your current tenants will show up here.',
  },
  Inquiries: {
    icon: IconMessageQuestion,
    title: 'No Inquiries Yet',
    description: "When someone asks about one of your listings, you'll see their message here.",
  },
};

export default function Chat() {
  const router = useRouter();
  const { colors } = useColors();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<ConversationFilter>('Tenant');

  const {
    conversations,
    loading,
    error,
    refetch,
    markConversationRead,
    updatePreferences,
    setBlocked,
  } = useConversations('landlord');

  const { rowHandlers, overlays } = useConversationRowActions({
    role: 'landlord',
    markConversationRead,
    updatePreferences,
    setBlocked,
  });

  // The spinner shows only for a pull, never for background refetches.
  const { refreshing, onRefresh } = usePullToRefresh(refetch);

  const isSearching = searchQuery.trim().length > 0;

  const { items, filteredCount } = useMemo(() => {
    const filtered = filterConversations(conversations, searchQuery);
    const ofSelectedType = filtered.filter((conversation) =>
      selectedFilter === 'Tenant'
        ? conversation.conversation_type === 'tenant'
        : conversation.conversation_type === 'inquiry'
    );

    // Search covers archived chats too, so they're listed with the rest.
    const groups = groupConversations(
      isSearching ? ofSelectedType.map((c) => ({ ...c, is_archived: false })) : ofSelectedType
    );
    return {
      items: buildConversationListItems({
        pinned: groups.pinned.map((conversation) => toConversationItem(conversation)),
        others: groups.others,
      }),
      filteredCount: groups.pinned.length + groups.others.length,
    };
  }, [conversations, isSearching, searchQuery, selectedFilter]);

  // The chat screen marks the conversation read once it's on screen.
  const handleChatPress = useCallback(
    (conversation: ConversationWithMeta) => {
      router.push({ pathname: '/chat/[conversationId]', params: getChatRouteParams(conversation) });
    },
    [router]
  );

  const handleOpenArchived = useCallback(() => {
    router.push({ pathname: '/chat/archived', params: { portal: 'landlord' } });
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: ConversationListItem }) => (
      <ConversationListRow
        item={item}
        onOpen={handleChatPress}
        handlers={rowHandlers}
      />
    ),
    [handleChatPress, rowHandlers]
  );

  const hasConversations = conversations.length > 0;

  const EmptyFilterIcon = FILTER_EMPTY_STATES[selectedFilter].icon;

  // Shown when the selected filter has no chats.
  const filterEmptyState = !isSearching && hasConversations && filteredCount === 0 ? (
    <EmptyState
      className='mt-6'
      icon={<EmptyFilterIcon size={36} color={colors.primary} />}
      title={FILTER_EMPTY_STATES[selectedFilter].title}
      description={FILTER_EMPTY_STATES[selectedFilter].description}
    />
  ) : null;

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
  ) : !hasConversations ? (
    <ConversationListState
      variant='illustrated'
      title='No Messages Yet'
      description='Start a conversation with a tenant to see your messages here.'
    />
  ) : isSearching ? (
    <ConversationListState
      variant='compact'
      title='No results found'
      description={`No conversations match "${searchQuery.trim()}". Try a different name, property, or message.`}
    />
  ) : (
    filterEmptyState
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
            showSearch={hasConversations}
            onOpenArchived={handleOpenArchived}
          >
            {hasConversations && !loading && !error && (
              <Tabs
                value={selectedFilter}
                onValueChange={(value) => setSelectedFilter(value as ConversationFilter)}
                variant="primary"
              >
                <Tabs.List className="w-full my-3">
                  <Tabs.Indicator />
                  <Tabs.Trigger value="Tenant" className="w-1/2">
                    <Tabs.Label>Tenant</Tabs.Label>
                  </Tabs.Trigger>

                  <Tabs.Trigger value="Inquiries" className="flex-1">
                    <Tabs.Label>Inquiries</Tabs.Label>
                  </Tabs.Trigger>
                </Tabs.List>
              </Tabs>
            )}
          </ConversationListHeader>
        </>}
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
          <PullToRefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      <ConversationActionOverlays {...overlays} />
    </ScreenWrapper>
  )
}
