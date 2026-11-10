import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";
import type { ReactNode } from "react";

import { useConversationReadSync } from "./useConversationReadSync";
import { getConversationsQueryKey, isViewingConversation } from "./conversationReadState";
import { createMobileQueryClient } from "@/utils/queryClient";
import { buildConversationKey } from "@/service/chat/chatService";

import type { ConversationWithMeta } from "@/service/chat/conversationService";
import { DEFAULT_CONVERSATION_PREFERENCES } from "@/service/chat/conversationPreferences";

const MY_ID = "user-1";
const OTHER_ID = "other-1";
const APARTMENT_ID = "apt-1";
const CONVERSATION_KEY = buildConversationKey(MY_ID, OTHER_ID, APARTMENT_ID);

const mockMarkMessagesAsRead = jest.fn();
let mockIsFocused = true;

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("@repo/supabase", () => ({ supabase: {} }));

jest.mock("expo-router", () => ({
  useIsFocused: () => mockIsFocused,
}));

jest.mock("@/service/chat/conversationActionsService", () => ({
  markConversationRead: (...args: unknown[]) => mockMarkMessagesAsRead(...args),
}));

const seedConversation: ConversationWithMeta = {
  conversation_key: CONVERSATION_KEY,
  other_user_id: OTHER_ID,
  other_user_name: "Other One",
  other_user_avatar: null,
  other_user_phone: null,
  apartment_id: APARTMENT_ID,
  apartment_name: "APT Homes",
  last_message: "hello",
  last_message_time: "2026-01-01T00:00:00Z",
  unread_count: 3,
  last_sender_is_me: false,
  last_sender_id: OTHER_ID,
  last_message_type: "text",
  conversation_type: "tenant",
  ...DEFAULT_CONVERSATION_PREFERENCES,
};

let appStateListener: ((state: AppStateStatus) => void) | undefined;

async function renderReadSync() {
  const client = createMobileQueryClient();
  client.setQueryData(getConversationsQueryKey(MY_ID, "tenant"), [seedConversation]);

  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  const hook = await renderHook(
    () => useConversationReadSync({ myId: MY_ID, otherUserId: OTHER_ID, apartmentId: APARTMENT_ID }),
    { wrapper: Wrapper },
  );

  const cachedUnread = () =>
    client.getQueryData<ConversationWithMeta[]>(getConversationsQueryKey(MY_ID, "tenant"))?.[0]
      .unread_count;

  return { ...hook, client, cachedUnread };
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockIsFocused = true;
  mockMarkMessagesAsRead.mockResolvedValue(undefined);
  Object.defineProperty(AppState, "currentState", { value: "active", configurable: true });
  jest.spyOn(AppState, "addEventListener").mockImplementation((_type, listener) => {
    appStateListener = listener as (state: AppStateStatus) => void;
    return { remove: jest.fn() } as unknown as ReturnType<typeof AppState.addEventListener>;
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("useConversationReadSync", () => {
  it("marks the conversation read and clears the list badge when it comes on screen", async () => {
    const { cachedUnread, unmount } = await renderReadSync();

    expect(mockMarkMessagesAsRead).toHaveBeenCalledWith({ otherUserId: OTHER_ID, apartmentId: APARTMENT_ID });
    expect(cachedUnread()).toBe(0);
    expect(isViewingConversation(CONVERSATION_KEY)).toBe(true);

    await unmount();
    expect(isViewingConversation(CONVERSATION_KEY)).toBe(false);
  });

  it("marks a burst of incoming messages read once", async () => {
    const { result, unmount } = await renderReadSync();
    mockMarkMessagesAsRead.mockClear();

    await act(() => {
      result.current.handleIncomingMessage();
      result.current.handleIncomingMessage();
      jest.advanceTimersByTime(500);
    });

    expect(mockMarkMessagesAsRead).toHaveBeenCalledTimes(1);
    await unmount();
  });

  it("clears the badge in every portal's cached list", async () => {
    const { result, client, unmount } = await renderReadSync();
    client.setQueryData(getConversationsQueryKey(MY_ID, "landlord"), [seedConversation]);

    await act(() => {
      result.current.handleIncomingMessage();
      jest.advanceTimersByTime(500);
    });

    expect(
      client.getQueryData<ConversationWithMeta[]>(getConversationsQueryKey(MY_ID, "landlord"))?.[0]
        .unread_count,
    ).toBe(0);
    await unmount();
  });

  it("saves a pending read when the chat closes before the delay ends", async () => {
    const { result, unmount } = await renderReadSync();
    mockMarkMessagesAsRead.mockClear();

    await act(() => {
      result.current.handleIncomingMessage();
    });
    await unmount();

    expect(mockMarkMessagesAsRead).toHaveBeenCalledTimes(1);
  });

  it("leaves messages unread while the chat is not focused", async () => {
    mockIsFocused = false;
    const { result, cachedUnread, unmount } = await renderReadSync();

    await act(() => {
      result.current.handleIncomingMessage();
      jest.advanceTimersByTime(500);
    });

    expect(mockMarkMessagesAsRead).not.toHaveBeenCalled();
    expect(cachedUnread()).toBe(3);
    expect(isViewingConversation(CONVERSATION_KEY)).toBe(false);
    await unmount();
  });

  it("stops reading in the background and catches up on return", async () => {
    const { result, unmount } = await renderReadSync();
    mockMarkMessagesAsRead.mockClear();

    await act(() => appStateListener?.("background"));
    expect(isViewingConversation(CONVERSATION_KEY)).toBe(false);

    await act(() => {
      result.current.handleIncomingMessage();
      jest.advanceTimersByTime(500);
    });
    expect(mockMarkMessagesAsRead).not.toHaveBeenCalled();

    await act(() => appStateListener?.("active"));
    expect(mockMarkMessagesAsRead).toHaveBeenCalledTimes(1);
    expect(isViewingConversation(CONVERSATION_KEY)).toBe(true);

    await unmount();
  });
});
