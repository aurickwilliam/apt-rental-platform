import { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Send, Sparkles } from "lucide-react-native";

import StandardHeader from "@/components/layout/StandardHeader";
import ScreenWrapper from "@/components/layout/ScreenWrapper";

import { useColors } from "@/hooks/useTheme";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

const INITIAL_MESSAGE: Message = {
  id: "0",
  role: "assistant",
  text: "Hi! I'm APT's AI assistant 🏠 Tell me what you're looking for in a rental — budget, location, number of rooms, or any preferences — and I'll help you find the perfect place.",
};

export default function AISearchScreen() {
  const {colors} = useColors();

  const scrollRef = useRef<ScrollView>(null);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // TODO: Replace with actual AI API call
      // const response = await fetch(...)
      // For now, placeholder response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: "I found a few apartments that might match what you're looking for! Let me narrow it down further — do you have a preferred area in Metro Manila?",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: "Sorry, I couldn't process that. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  return (
    <ScreenWrapper>
      <StandardHeader title="AI Search" showBack />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map((message) => {
            const isUser = message.role === "user";
            return (
              <View
                key={message.id}
                className={`mb-3 flex-row ${isUser ? "justify-end" : "justify-start"}`}
              >
                {/* AI Avatar */}
                {!isUser && (
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center mr-2 mt-1"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Sparkles size={14} color="#fff" />
                  </View>
                )}

                {/* Bubble */}
                <View
                  className={`rounded-2xl px-4 py-3 max-w-[78%] ${
                    isUser
                      ? "rounded-tr-sm bg-primary"
                      : "rounded-tl-sm bg-default-100"
                  }`}
                >
                  <Text
                    className={`text-sm leading-5 ${
                      isUser ? "text-white" : "text-foreground"
                    }`}
                  >
                    {message.text}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* Typing indicator */}
          {isLoading && (
            <View className="flex-row justify-start mb-3">
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-2 mt-1"
                style={{ backgroundColor: colors.primary }}
              >
                <Sparkles size={14} color="#fff" />
              </View>
              <View className="bg-default-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <Text className="text-default-400 text-sm">Thinking...</Text>
              </View>
            </View>
          )}

          <View className="h-4" />
        </ScrollView>

        {/* Input */}
        <View className="px-4 py-3 border-t border-divider flex-row items-end gap-2">
          <TextInput
            className="flex-1 bg-default-100 rounded-2xl px-4 py-3 text-sm text-foreground"
            placeholder="Ask me anything about rentals..."
            placeholderTextColor={colors.gray400}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 rounded-full items-center justify-center"
            style={{
              backgroundColor:
                input.trim() && !isLoading ? colors.primary : colors.gray400,
            }}
          >
            <Send
              size={18}
              color={input.trim() && !isLoading ? "#fff" : colors.gray400}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}