import {
  View,
  Text,
  KeyboardAvoidingView,
  FlatList,
  ActivityIndicator,
  LayoutChangeEvent,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ScreenWrapper from 'components/layout/ScreenWrapper';
import ChatHeader from 'components/layout/ChatHeader';
import ChatBubble from 'components/display/ChatBubble';
import ChatBox from 'components/inputs/ChatBox';

import { supabase } from '@repo/supabase';
import { getRelativeTime } from '@repo/utils';
import { COLORS } from '@repo/constants';

type Message = {
  id: string;
  message: string;
  timestamp: string;
  isSent: boolean;
  isPending?: boolean;
};

export default function ChatScreen() {
  const insets = useSafeAreaInsets();

  const {
    conversationId: conversationIdParam,
    otherUserId: otherUserIdParam,
    otherUserName: otherUserNameParam,
    otherUserAvatar: otherUserAvatarParam,
    apartmentId: apartmentIdParam,
  } = useLocalSearchParams<{
    conversationId: string;
    otherUserId: string;
    otherUserName?: string;
    otherUserAvatar?: string;
    apartmentId?: string;
  }>();

  const normalizeParam = (value?: string | string[]) =>
    Array.isArray(value) ? value[0] : value;

  const conversationId = normalizeParam(conversationIdParam) ?? '';
  const otherUserId = normalizeParam(otherUserIdParam) ?? '';
  const routedOtherUserName = normalizeParam(otherUserNameParam);
  const routedOtherUserAvatar = normalizeParam(otherUserAvatarParam);
  const routedApartmentId = normalizeParam(apartmentIdParam);

  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [otherUserName, setOtherUserName] = useState(routedOtherUserName ?? 'User');
  const [otherUserAvatar, setOtherUserAvatar] = useState<string | null>(
    routedOtherUserAvatar ?? null
  );
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const apartmentId =
    routedApartmentId === 'none' || !routedApartmentId ? null : routedApartmentId;

  useEffect(() => {
    if (routedOtherUserName) {
      setOtherUserName(routedOtherUserName);
    }
    if (routedOtherUserAvatar) {
      setOtherUserAvatar(routedOtherUserAvatar);
    }
  }, [routedOtherUserAvatar, routedOtherUserName]);

  const fetchMessages = useCallback(async (currentUserId: string) => {
    if (!otherUserId) {
      setMessages([]);
      return;
    }

    let query = supabase
      .from('chat')
      .select('id, message, created_at, sender_id, receiver_id, apartment_id')
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
      )
      .order('created_at', { ascending: false });

    // Filter by apartment if linked
    if (apartmentId) {
      query = query.eq('apartment_id', apartmentId);
    } else {
      query = query.is('apartment_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;

    setMessages(mapMessages(data ?? [], currentUserId));
  }, [apartmentId, otherUserId]);

  const subscribeToMessages = useCallback((currentUserId: string) => {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat',
        },
        (payload) => {
          const row = payload.new as any;
          // Only process messages that belong to this thread
          const isRelevant =
            (row.sender_id === currentUserId && row.receiver_id === otherUserId) ||
            (row.sender_id === otherUserId && row.receiver_id === currentUserId);
          const matchesApartment = apartmentId
            ? row.apartment_id === apartmentId
            : row.apartment_id == null;
          if (!isRelevant || !matchesApartment) return;

          const newMsg: Message = {
            id: row.id,
            message: row.message,
            timestamp: getRelativeTime(new Date(row.created_at)),
            isSent: row.sender_id === currentUserId,
          };

          // FlatList is inverted so prepend, and ignore duplicates.
          setMessages((prev) => {
            if (prev.some((msg) => msg.id === newMsg.id)) return prev;
            return [newMsg, ...prev];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [apartmentId, conversationId, otherUserId]);

  const fetchOtherUserProfile = useCallback(async () => {
    if (!otherUserId) return;

    const { data, error } = await supabase
      .from('users')
      .select('first_name, last_name, avatar_url')
      .eq('id', otherUserId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return;

    if (!routedOtherUserName) {
      const fullName = `${data.first_name} ${data.last_name}`.trim();
      if (fullName) {
        setOtherUserName(fullName);
      }
    }

    if (!routedOtherUserAvatar && data.avatar_url) {
      setOtherUserAvatar(data.avatar_url);
    }
  }, [otherUserId, routedOtherUserAvatar, routedOtherUserName]);

  const initChat = useCallback(async () => {
    try {
      // 1. Resolve current user's public.users id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;
      setMyId(profile.id);

      await fetchOtherUserProfile();

      // 2. Fetch existing messages for this thread
      await fetchMessages(profile.id);

      // 3. Subscribe to new messages in real-time
      unsubscribeRef.current?.();
      unsubscribeRef.current = subscribeToMessages(profile.id);
    } catch (err) {
      console.error('Chat init error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchMessages, fetchOtherUserProfile, subscribeToMessages]);

  useEffect(() => {
    initChat();

    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, [initChat]);

  function mapMessages(rows: any[], currentUserId: string): Message[] {
    return rows.map((m) => ({
      id: m.id,
      message: m.message,
      timestamp: getRelativeTime(new Date(m.created_at)),
      isSent: m.sender_id === currentUserId,
    }));
  }

  async function handleSend() {
    if (!chatMessage.trim() || !myId || !otherUserId || sending) return;

    const text = chatMessage.trim();
    const tempId = `temp-${Date.now()}`;

    const pendingMsg: Message = {
      id: tempId,
      message: text,
      timestamp: 'Sending...',
      isSent: true,
      isPending: true,
    };

    setMessages((prev) => [pendingMsg, ...prev]);
    setChatMessage('');
    setSending(true);

    console.log('Sending message:', {
      sender_id: myId,
      receiver_id: otherUserId,
      message: text,
      apartment_id: apartmentId ?? null,
    });

    try {
      const { data: insertedRow, error } = await supabase
        .from('chat')
        .insert({
          sender_id: myId,
          receiver_id: otherUserId,
          message: text,
          apartment_id: apartmentId ?? null,
          is_read: false,
        })
        .select('id, message, created_at, sender_id')
        .single();

      if (error) throw error;

      // Ensure immediate UI update even when realtime delivery is delayed.
      if (insertedRow) {
        const sentMsg: Message = {
          id: insertedRow.id,
          message: insertedRow.message,
          timestamp: getRelativeTime(new Date(insertedRow.created_at)),
          isSent: insertedRow.sender_id === myId,
        };

        setMessages((prev) => {
          if (prev.some((msg) => msg.id === sentMsg.id)) {
            return prev.filter((msg) => msg.id !== tempId);
          }

          const pendingIndex = prev.findIndex((msg) => msg.id === tempId);
          if (pendingIndex !== -1) {
            const next = [...prev];
            next[pendingIndex] = sentMsg;
            return next;
          }

          return [sentMsg, ...prev];
        });
      }
    } catch (err) {
      console.error('Send failed:', err);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setChatMessage(text); // Restore on failure
    } finally {
      setSending(false);
    }
  }

  const handleHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = Math.round(event.nativeEvent.layout.height);
    setHeaderHeight((prev) => (prev === nextHeight ? prev : nextHeight));
  }, []);

  return (
    <ScreenWrapper
      dismissKeyboardOnTouch={false}
      header={
        <View onLayout={handleHeaderLayout}>
          <ChatHeader
            name={otherUserName}
            profilePicture={otherUserAvatar ?? undefined}
          />
        </View>
      }
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={'padding'}
        keyboardVerticalOffset={headerHeight}
      >
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            inverted
            ref={flatListRef}
            style={{ flex: 1 }}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ChatBubble
                message={item.message}
                timestamp={item.timestamp}
                isSent={item.isSent}
              />
            )}
            contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 10 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
            nestedScrollEnabled
            ListEmptyComponent={
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 24 }}>
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E5E7EB',
                    borderWidth: 1,
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    maxWidth: '92%',
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.primary,
                      fontSize: 14,
                      textAlign: 'center',
                      fontWeight: '600',
                    }}
                  >
                    No messages yet
                  </Text>
                  <Text
                    style={{
                      marginTop: 4,
                      color: '#6B7280',
                      fontSize: 12,
                      textAlign: 'center',
                    }}
                  >
                    Say hi to start the conversation.
                  </Text>
                </View>
              </View>
            }
          />
        )}

        <View
          style={{
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 12,
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, 8),
          }}
        >
          <ChatBox
            chatValue={chatMessage}
            onChatValueChange={setChatMessage}
            onSendPress={handleSend}       
            isDisabled={sending}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}