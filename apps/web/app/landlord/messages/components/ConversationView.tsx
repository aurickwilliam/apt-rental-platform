"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Avatar, ScrollShadow, Spinner } from "@heroui/react";

import MessageInput from "./MessageInput";
import { Contact, Message } from "./types";

import { createClient } from "@repo/supabase/browser";

interface ConversationViewProps {
  activeContact: Contact | null;
  currentUserId: string;
}

function TypingIndicator() {
  return (
    <div className="self-start flex items-center gap-1 bg-white px-4 py-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 w-fit">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ConversationView({ activeContact, currentUserId }: ConversationViewProps) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isContactTyping, setIsContactTyping] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch existing messages
  useEffect(() => {
    if (!activeContact) {
      return;
    }

    let isCancelled = false;

    const fetchMessages = async () => {
      setIsLoading(true);
      setIsContactTyping(false);

      const { data, error } = await supabase
        .from("chat")
        .select("*")
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${activeContact.id}),` +
          `and(sender_id.eq.${activeContact.id},receiver_id.eq.${currentUserId})`
        )
        .order("created_at", { ascending: true });

      if (!isCancelled) {
        if (!error && data) setMessages(data as Message[]);
        setIsLoading(false);
      }
    };

    fetchMessages();

    return () => {
      isCancelled = true;
    };
  }, [activeContact, currentUserId, supabase]);

  // Realtime: new messages + typing presence
  useEffect(() => {
    if (!activeContact) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const conversationId = [currentUserId, activeContact.id].sort().join("_");

    const channel = supabase
      .channel(`conversation:${conversationId}`, {
        config: { presence: { key: currentUserId } },
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat",
          filter: `sender_id=eq.${activeContact.id}`,
        },
        (payload: { new: Message }) => {
          const incoming = payload.new as Message;
          if (incoming.receiver_id === currentUserId) {
            setMessages((prev) => [...prev, incoming]);
          }
        }
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ isTyping: boolean }>();
        const contactState = state[activeContact.id];
        setIsContactTyping(contactState?.[0]?.isTyping ?? false);
      })
      .subscribe(async (status: "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR") => {
        if (status === "SUBSCRIBED") {
          await channel.track({ isTyping: false });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeContact, currentUserId, supabase]);

  // Auto-scroll to bottom on new messages or typing indicator change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isContactTyping]);

  const handleSend = async (content: string) => {
    if (!activeContact) return;

    const optimistic: Message = {
      id: crypto.randomUUID(),
      sender_id: currentUserId,
      receiver_id: activeContact.id,
      message: content,
      is_read: false,
      read_at: null,
      apartment_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const { error } = await supabase.from("chat").insert({
      sender_id: currentUserId,
      receiver_id: activeContact.id,
      message: content,
    });

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      console.error("Failed to send:", error.message);
    }
  };

  const handleTypingChange = async (isTyping: boolean) => {
    if (channelRef.current) {
      await channelRef.current.track({ isTyping });
    }
  };

  // Empty State
  if (!activeContact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-2">
          <span className="text-2xl">
            💬
          </span>
        </div>
        <p>
          Select a conversation from the sidebar to start messaging
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center gap-4 bg-white shadow-sm z-10">
        <Avatar 
          src={activeContact.avatar} 
          alt={activeContact.name} 
          size="lg" 
        />
        <div>
          <h2 className="text-lg font-bold text-gray-800 leading-tight">
            {activeContact.name}
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            {activeContact.apartment}
          </p>
        </div>
      </div>

      {/* Chat History */}
      <ScrollShadow 
        className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4"
        visibility="none"
      >
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="md" color="primary" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg) => {
              const isMine = msg.sender_id === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[80%] ${
                    isMine 
                      ? "self-end items-end" 
                      : "self-start items-start"
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl shadow-sm ${
                      isMine
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-white text-gray-700 border border-gray-100 rounded-tl-none"
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                  </div>
                  <span className="text-[10px] mt-1 text-gray-400">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              );
            })}

            {isContactTyping && <TypingIndicator />}

            <div ref={bottomRef} />
          </div>
        )}
      </ScrollShadow>

      <MessageInput 
        onSend={handleSend} 
        onTypingChange={handleTypingChange} 
      />
    </div>
  );
}