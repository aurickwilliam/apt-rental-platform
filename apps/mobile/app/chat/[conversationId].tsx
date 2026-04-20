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

type PresenceState = {
  userId: string;
  isTyping: boolean;
  lastTypedAt?: number;
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
  const [otherUserIsTyping, setOtherUserIsTyping] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  // A single Supabase channel that handles both postgres_changes AND presence.
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  // Keep myId accessible inside callbacks without causing re-subscriptions.
  const myIdRef = useRef<string | null>(null);

  const isSubscribedRef = useRef(false);
  // Add a second ref for the presence channel
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const isTypingRef = useRef(false);
  const typingStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingHeartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const apartmentId =
    routedApartmentId === 'none' || !routedApartmentId ? null : routedApartmentId;

  useEffect(() => {
    if (routedOtherUserName) setOtherUserName(routedOtherUserName);
    if (routedOtherUserAvatar) setOtherUserAvatar(routedOtherUserAvatar);
  }, [routedOtherUserAvatar, routedOtherUserName]);

  // Fetch existing messages for this conversation + apartment (if any).
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

    if (apartmentId) {
      query = query.eq('apartment_id', apartmentId);
    } else {
      query = query.is('apartment_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;

    setMessages(mapMessages(data ?? [], currentUserId));
  }, [apartmentId, otherUserId]);

  // Fetch the other user's profile info (name + avatar) for the header.
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
      if (fullName) setOtherUserName(fullName);
    }

    if (!routedOtherUserAvatar && data.avatar_url) {
      setOtherUserAvatar(data.avatar_url);
    }
  }, [otherUserId, routedOtherUserAvatar, routedOtherUserName]);

  // Set up a single Supabase channel to handle both incoming messages (via postgres_changes)
  const setupChannel = useCallback((currentUserId: string) => {
    // Tear down both channels first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (presenceChannelRef.current) {
      supabase.removeChannel(presenceChannelRef.current);
      presenceChannelRef.current = null;
    }
    isSubscribedRef.current = false;

    // ── Channel 1: Broadcast only (messages) ─────────────────────────
    const msgChannel = supabase.channel(`chat:msg:${conversationId}`);

    msgChannel
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        if (payload.sender_id === currentUserId) return;

        const matchesApartment = apartmentId
          ? payload.apartment_id === apartmentId
          : payload.apartment_id == null;

        if (!matchesApartment) return;

        const newMsg: Message = {
          id: payload.id,
          message: payload.message,
          timestamp: getRelativeTime(new Date(payload.created_at)),
          isSent: false,
        };

        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [newMsg, ...prev];
        });

        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }, 100);
      })
      .subscribe((status) => {
        isSubscribedRef.current = status === 'SUBSCRIBED';
      });

    channelRef.current = msgChannel;

    // ── Channel 2: Presence only (typing indicator) ───────────────────
    const presenceChannel = supabase.channel(`chat:presence:${conversationId}`, {
      config: { presence: { key: currentUserId } },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState<PresenceState>();

        const otherEntry = Object.entries(state).find(
          ([key]) => key === otherUserId
        )?.[1];

        let isTyping = false;

        if (Array.isArray(otherEntry)) {
          isTyping = otherEntry.some((p) => {
            const isFresh =
              p.lastTypedAt && Date.now() - p.lastTypedAt < 5000; // expires after 5s
            return p.isTyping === true && isFresh;
          });
        }

        setOtherUserIsTyping(prev => prev === isTyping ? prev : isTyping);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key === otherUserId) {
          const isTyping = newPresences.some((p: any) => p.isTyping === true);
          setOtherUserIsTyping(prev => prev === isTyping ? prev : isTyping);
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key === otherUserId) setOtherUserIsTyping(false);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setTimeout(() => {
            presenceChannel.track({
              userId: currentUserId,
              isTyping: false,
              lastTypedAt: Date.now(),
            });
          }, 100);
        }
      });

    presenceChannelRef.current = presenceChannel;
  }, [apartmentId, conversationId, otherUserId]);

  
  // Initial data fetch: get my profile, the other user's profile, and the existing messages. Also sets up the channels.
  const initChat = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      myIdRef.current = profile.id;
      setMyId(profile.id);

      await fetchOtherUserProfile();
      await fetchMessages(profile.id);

      setupChannel(profile.id);
    } catch (err) {
      console.error('Chat init error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchMessages, fetchOtherUserProfile, setupChannel]);


  const stopTyping = useCallback(() => {
    if (!presenceChannelRef.current || !myIdRef.current) return;

    if (typingStopTimeoutRef.current) {
      clearTimeout(typingStopTimeoutRef.current);
      typingStopTimeoutRef.current = null;
    }

    if (typingHeartbeatRef.current) {
      clearInterval(typingHeartbeatRef.current);
      typingHeartbeatRef.current = null;
    }

    if (isTypingRef.current) {
      presenceChannelRef.current.track({
        userId: myIdRef.current,
        isTyping: false,
        lastTypedAt: Date.now(),
      });

      isTypingRef.current = false;
    }
  }, []);

  // Handles the typing presence
  const TYPING_IDLE_DELAY = 2000;     // stop typing after 2s inactivity
  const TYPING_HEARTBEAT = 4000;      // keep alive every 4s

  const handleChatMessageChange = useCallback((text: string) => {
    setChatMessage(text);

    if (!presenceChannelRef.current || !myIdRef.current) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;

      presenceChannelRef.current.track({
        userId: myIdRef.current,
        isTyping: true,
        lastTypedAt: Date.now(),
      });

      if (!typingHeartbeatRef.current) {
        typingHeartbeatRef.current = setInterval(() => {
          presenceChannelRef.current?.track({
            userId: myIdRef.current,
            isTyping: true,
            lastTypedAt: Date.now(),
          });
        }, TYPING_HEARTBEAT);
      }
    }

    // ⏱ Reset idle timer
    if (typingStopTimeoutRef.current) {
      clearTimeout(typingStopTimeoutRef.current);
    }

    typingStopTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, TYPING_IDLE_DELAY);
  }, [stopTyping]);

  const handleInputFocus = useCallback(() => {}, []);

  const handleInputBlur = useCallback(() => {
    stopTyping();
  }, [stopTyping]);

  useEffect(() => {
    initChat();

    return () => {
      stopTyping();

      if (typingHeartbeatRef.current) {
        clearInterval(typingHeartbeatRef.current);
      }

      if (typingStopTimeoutRef.current) {
        clearTimeout(typingStopTimeoutRef.current);
      }

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
    };
  }, [initChat, stopTyping]);
  
  // Handles the sending/inserting of message
  async function handleSend() {
    stopTyping();

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

    // Scroll to bottom immediately to show the pending message, instead of waiting for the DB round-trip.
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 100);

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

      if (insertedRow) {
        const sentMsg: Message = {
          id: insertedRow.id,
          message: insertedRow.message,
          timestamp: getRelativeTime(new Date(insertedRow.created_at)),
          isSent: true,
        };

        setMessages((prev) => {
          if (prev.some((m) => m.id === sentMsg.id)) {
            return prev.filter((m) => m.id !== tempId);
          }
          const pendingIndex = prev.findIndex((m) => m.id === tempId);
          if (pendingIndex !== -1) {
            const next = [...prev];
            next[pendingIndex] = sentMsg;
            return next;
          }
          return [sentMsg, ...prev];
        });

        // Use the already-subscribed channel — no fallback to REST, no warnings.
        if (isSubscribedRef.current) {
          channelRef.current?.send({
            type: 'broadcast',
            event: 'new_message',
            payload: {
              id: insertedRow.id,
              message: insertedRow.message,
              created_at: insertedRow.created_at,
              sender_id: myId,
              apartment_id: apartmentId ?? null,
            },
          });
        }
      }
    } catch (err) {
      console.error('Send failed:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setChatMessage(text);
    } finally {
      setSending(false);
    }
  }

  function mapMessages(rows: any[], currentUserId: string): Message[] {
    return rows.map((m) => ({
      id: m.id,
      message: m.message,
      timestamp: getRelativeTime(new Date(m.created_at)),
      isSent: m.sender_id === currentUserId,
    }));
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
            // ── Typing indicator (shown at the bottom of the inverted list) ──
            ListHeaderComponent={
              otherUserIsTyping ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: 4,
                    paddingVertical: 6,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 4,
                      backgroundColor: '#F3F4F6',
                      borderRadius: 12,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }}
                  >
                    {/* Three animated dots — pure layout, no Animated API needed */}
                    {[0, 1, 2].map((i) => (
                      <View
                        key={i}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: '#9CA3AF',
                          opacity: 0.6 + i * 0.2,
                        }}
                      />
                    ))}
                  </View>
                  <Text style={{ fontSize: 11, color: '#9CA3AF' }}>typing…</Text>
                </View>
              ) : null
            }
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
            onChatValueChange={handleChatMessageChange}
            onSendPress={handleSend}
            isDisabled={sending}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}