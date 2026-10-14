import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import {
  CONVERSATIONS_LOAD_ERROR_MESSAGE,
  useConversations,
  getConversationsQueryKey,
} from "./useConversations";
import { beginViewingConversation } from "./conversationReadState";
import { createMobileQueryClient } from "@/utils/queryClient";

import type { ConversationWithMeta } from "@/service/chat/conversationService";
import { DEFAULT_CONVERSATION_PREFERENCES } from "@/service/chat/conversationPreferences";

const MY_ID = "user-1";
const mockUseCurrentUser = jest.fn();
const mockFetchConversations = jest.fn();
const mockChannelFn = jest.fn();
const mockRemoveChannel = jest.fn();
const mockGetChannels = jest.fn();
const mockMarkMessagesAsRead = jest.fn();
const mockSetConversationPreference = jest.fn();
let chatInsertCallback:
  | ((payload: { new?: unknown }) => void)
  | undefined;
let chatDeleteCallback:
  | ((payload: { old?: unknown }) => void)
  | undefined;

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock("hooks/auth", () => ({
  useCurrentUser: () => mockUseCurrentUser(),
  useProfile: () => ({ profile: { id: MY_ID }, loading: false }),
}));

jest.mock("@repo/supabase", () => ({
  supabase: {
    channel: (...args: unknown[]) => mockChannelFn(...args),
    removeChannel: (...args: unknown[]) => mockRemoveChannel(...args),
    getChannels: () => mockGetChannels(),
  },
}));

jest.mock("@/service/chat/conversationActionsService", () => ({
  ...jest.requireActual("@/service/chat/conversationActionsService"),
  markConversationRead: (...args: unknown[]) => mockMarkMessagesAsRead(...args),
  setConversationPreference: (...args: unknown[]) => mockSetConversationPreference(...args),
  blockUser: jest.fn(),
  unblockUser: jest.fn(),
}));

jest.mock("@/service/chat/conversationService", () => ({
  fetchConversationsWithMetadata: (...args: unknown[]) =>
    mockFetchConversations(...args),
}));

const seedConversations: ConversationWithMeta[] = [
  {
    other_user_id: "other-1",
    other_user_name: "Other One",
    other_user_avatar: null,
    other_user_phone: null,
    apartment_id: "apt-1",
    apartment_name: "APT Homes",
    last_message: "hello",
    last_message_time: "2026-01-01T00:00:00Z",
    unread_count: 0,
    conversation_key: "other-1:apt-1",
    last_sender_is_me: false,
    last_sender_id: null,
    last_message_type: "text",
    conversation_type: "tenant",
    ...DEFAULT_CONVERSATION_PREFERENCES,
  },
  {
    other_user_id: "other-2",
    other_user_name: "Other Two",
    other_user_avatar: null,
    other_user_phone: null,
    apartment_id: "apt-2",
    apartment_name: "APT Loft",
    last_message: "hello too",
    last_message_time: "2026-01-01T00:01:00Z",
    unread_count: 2,
    conversation_key: "other-2:apt-2",
    last_sender_is_me: true,
    last_sender_id: null,
    last_message_type: "text",
    conversation_type: "inquiry",
    ...DEFAULT_CONVERSATION_PREFERENCES,
  },
];

function createWrapper() {
  const client = createMobileQueryClient();

  function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  return { client, QueryWrapper };
}

beforeEach(() => {
  jest.clearAllMocks();
  chatInsertCallback = undefined;
  chatDeleteCallback = undefined;
  mockUseCurrentUser.mockReturnValue({
    data: { id: MY_ID },
    isLoading: false,
    error: null,
  });
  mockFetchConversations.mockResolvedValue(seedConversations);
  mockMarkMessagesAsRead.mockResolvedValue(undefined);
  mockSetConversationPreference.mockResolvedValue(undefined);
  mockGetChannels.mockReturnValue([]);
  mockChannelFn.mockImplementation((name: string) => {
    const channel = {
      topic: `realtime:${name}`,
      on: jest.fn(),
      subscribe: jest.fn(),
    };

    channel.on.mockImplementation(
      (
        _event: string,
        filter: { table?: string; event?: string },
        callback: (payload: { new?: unknown; old?: unknown }) => void,
      ) => {
        if (filter.table === "chat") {
          if (filter.event === "INSERT") {
            chatInsertCallback = callback as (payload: { new?: unknown }) => void;
          } else if (filter.event === "DELETE") {
            chatDeleteCallback = callback as (payload: { old?: unknown }) => void;
          } else {
            chatInsertCallback = callback as (payload: { new?: unknown }) => void;
          }
        }
        return channel;
      },
    );
    channel.subscribe.mockReturnValue(channel);

    return channel;
  });
});

async function fireChatInsert(payload: unknown) {
  await act(async () => {
    chatInsertCallback?.({ new: payload });
  });
}

async function fireChatDelete(payload: unknown) {
  await act(async () => {
    chatDeleteCallback?.({ old: payload });
  });
}

describe("useConversations", () => {
  /** Validates: m7 — keyed query loads conversations for the current user */
  it("fetches conversations with the keyed query", async () => {
    const { QueryWrapper } = createWrapper();

    const { result, unmount } = renderHook(
      () => useConversations("tenant"),
      { wrapper: QueryWrapper },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetchConversations).toHaveBeenCalledWith(MY_ID, "tenant");
    expect(result.current.conversations).toHaveLength(2);

    unmount();
  });

  /** Validates: m7 — realtime INSERT merges into the cached list (front) */
  it("merges a realtime INSERT into the cached conversations list", async () => {
    const { client, QueryWrapper } = createWrapper();
    client.setQueryData(getConversationsQueryKey(MY_ID, "tenant"), seedConversations);

    const { result, unmount } = renderHook(
      () => useConversations("tenant"),
      { wrapper: QueryWrapper },
    );

    await waitFor(() => expect(chatInsertCallback).toBeDefined());

    await fireChatInsert({
      sender_id: "other-1",
      receiver_id: MY_ID,
      apartment_id: "apt-1",
      message: "follow-up",
      message_type: "text",
      created_at: "2026-01-01T00:02:00Z",
    });

    await waitFor(() =>
      expect(result.current.conversations[0]).toMatchObject({
        other_user_id: "other-1",
        last_message: "follow-up",
        last_sender_is_me: false,
        unread_count: 1,
      }),
    );
    expect(result.current.conversations[1].other_user_id).toBe("other-2");

    unmount();
  });

  /** Validates: m7 — own-message INSERT does not bump unread count */
  it("does not bump unread_count when I sent the message", async () => {
    const { client, QueryWrapper } = createWrapper();
    client.setQueryData(getConversationsQueryKey(MY_ID, "tenant"), seedConversations);

    const { result, unmount } = renderHook(
      () => useConversations("tenant"),
      { wrapper: QueryWrapper },
    );

    await waitFor(() => expect(chatInsertCallback).toBeDefined());

    await fireChatInsert({
      sender_id: MY_ID,
      receiver_id: "other-2",
      apartment_id: "apt-2",
      message: "replied",
      message_type: "text",
      created_at: "2026-01-01T00:03:00Z",
    });

    await waitFor(() =>
      expect(result.current.conversations[0]).toMatchObject({
        other_user_id: "other-2",
        last_message: "replied",
        last_sender_is_me: true,
        unread_count: 2,
      }),
    );

    unmount();
  });

  it("does not bump unread_count for the conversation on screen", async () => {
    const { client, QueryWrapper } = createWrapper();
    client.setQueryData(getConversationsQueryKey(MY_ID, "tenant"), seedConversations);
    const endViewing = beginViewingConversation("other-1:apt-1");

    const { result, unmount } = renderHook(
      () => useConversations("tenant"),
      { wrapper: QueryWrapper },
    );

    await waitFor(() => expect(chatInsertCallback).toBeDefined());

    await fireChatInsert({
      sender_id: "other-1",
      receiver_id: MY_ID,
      apartment_id: "apt-1",
      message: "seen live",
      message_type: "text",
      created_at: "2026-01-01T00:02:00Z",
    });

    await waitFor(() =>
      expect(result.current.conversations[0]).toMatchObject({
        other_user_id: "other-1",
        last_message: "seen live",
        unread_count: 0,
      }),
    );

    endViewing();
    unmount();
  });

  /** Validates: m7 — unknown conversation triggers a refetch, not a corrupt merge */
  it("invalidates the query when the INSERT targets an unknown conversation", async () => {
    const { client, QueryWrapper } = createWrapper();
    const invalidateSpy = jest.spyOn(client, "invalidateQueries");
    client.setQueryData(getConversationsQueryKey(MY_ID, "tenant"), seedConversations);

    const { unmount } = renderHook(
      () => useConversations("tenant"),
      { wrapper: QueryWrapper },
    );

    await waitFor(() => expect(chatInsertCallback).toBeDefined());

    await fireChatInsert({
      sender_id: "stranger",
      receiver_id: MY_ID,
      apartment_id: "apt-99",
      message: "who are you?",
      message_type: "text",
      created_at: "2026-01-01T00:04:00Z",
    });

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: getConversationsQueryKey(MY_ID, "tenant"),
        exact: true,
      }),
    );

    unmount();
  });

  /** Validates: m7 — markConversationRead zeroes only the targeted conversation */
  it("marks a single conversation read", async () => {
    const { client, QueryWrapper } = createWrapper();
    client.setQueryData(getConversationsQueryKey(MY_ID, "tenant"), seedConversations);

    const { result, unmount } = renderHook(
      () => useConversations("tenant"),
      { wrapper: QueryWrapper },
    );

    await waitFor(() => expect(chatInsertCallback).toBeDefined());

    await act(async () => {
      result.current.markConversationRead("other-2:apt-2");
    });

    await waitFor(() =>
      expect(
        result.current.conversations.find(
          (c) => c.conversation_key === "other-2:apt-2",
        )?.unread_count,
      ).toBe(0),
    );
    expect(mockMarkMessagesAsRead).toHaveBeenCalledWith({ otherUserId: "other-2", apartmentId: "apt-2" });

    unmount();
  });

  it("puts the unread badge back when saving the read state fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockMarkMessagesAsRead.mockRejectedValueOnce(new Error("offline"));
    const { client, QueryWrapper } = createWrapper();
    client.setQueryData(getConversationsQueryKey(MY_ID, "tenant"), seedConversations);

    const { result, unmount } = renderHook(
      () => useConversations("tenant"),
      { wrapper: QueryWrapper },
    );

    await waitFor(() => expect(chatInsertCallback).toBeDefined());

    await act(async () => {
      await result.current.markConversationRead("other-2:apt-2");
    });

    expect(
      result.current.conversations.find(
        (c) => c.conversation_key === "other-2:apt-2",
      )?.unread_count,
    ).toBe(2);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
    unmount();
  });

  it("shows a friendly message and logs the raw error when loading fails", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const rawError = { code: "42501", message: "permission denied for function" };
    mockFetchConversations.mockRejectedValue(rawError);
    const { QueryWrapper } = createWrapper();

    const { result, unmount } = renderHook(
      () => useConversations("tenant"),
      { wrapper: QueryWrapper },
    );

    await waitFor(() => expect(result.current.error).toBe(CONVERSATIONS_LOAD_ERROR_MESSAGE), {
      timeout: 5000,
    });
    expect(result.current.error).not.toContain("permission");
    expect(consoleSpy).toHaveBeenCalledWith(
      "[conversations] Failed to load conversations:",
      rawError,
    );

    consoleSpy.mockRestore();
    unmount();
  });

  it("archives optimistically and saves the change", async () => {
    const { client, QueryWrapper } = createWrapper();
    client.setQueryData(getConversationsQueryKey(MY_ID, "tenant"), seedConversations);

    const { result, unmount } = renderHook(
      () => useConversations("tenant"),
      { wrapper: QueryWrapper },
    );
    await waitFor(() => expect(result.current.conversations).toHaveLength(2));

    const pinned = { ...result.current.conversations[0], is_pinned: true };
    await act(async () => {
      await result.current.updatePreferences(pinned, { archived: true });
    });

    await waitFor(() =>
      expect(result.current.conversations[0]).toMatchObject({ is_archived: true, is_pinned: false }),
    );
    expect(mockSetConversationPreference).toHaveBeenCalledWith(
      { otherUserId: "other-1", apartmentId: "apt-1" },
      { archived: true },
    );

    unmount();
  });

  it("puts the preference back and rethrows when saving fails", async () => {
    mockSetConversationPreference.mockRejectedValueOnce(new Error("offline"));
    const { client, QueryWrapper } = createWrapper();
    client.setQueryData(getConversationsQueryKey(MY_ID, "tenant"), seedConversations);

    const { result, unmount } = renderHook(
      () => useConversations("tenant"),
      { wrapper: QueryWrapper },
    );
    await waitFor(() => expect(result.current.conversations).toHaveLength(2));

    await act(async () => {
      await expect(
        result.current.updatePreferences(result.current.conversations[0], { pinned: true }),
      ).rejects.toThrow("offline");
    });

    await waitFor(() =>
      expect(result.current.conversations[0]).toMatchObject({ is_pinned: false, pinned_at: null }),
    );

    unmount();
  });

  it("brings an archived conversation back when a new message arrives", async () => {
    const { client, QueryWrapper } = createWrapper();
    client.setQueryData(getConversationsQueryKey(MY_ID, "tenant"), [
      { ...seedConversations[0], is_archived: true },
      seedConversations[1],
    ]);

    const { result, unmount } = renderHook(
      () => useConversations("tenant"),
      { wrapper: QueryWrapper },
    );
    await waitFor(() => expect(chatInsertCallback).toBeDefined());

    await fireChatInsert({
      sender_id: "other-1",
      receiver_id: MY_ID,
      apartment_id: "apt-1",
      message: "are you there?",
      message_type: "text",
      created_at: "2026-01-01T00:05:00Z",
    });

    await waitFor(() =>
      expect(result.current.conversations[0]).toMatchObject({
        other_user_id: "other-1",
        is_archived: false,
      }),
    );

    unmount();
  });

  it("does not open a realtime channel when subscribe is false", async () => {
    const { QueryWrapper } = createWrapper();

    const { unmount } = renderHook(
      () => useConversations("tenant", { subscribe: false }),
      { wrapper: QueryWrapper },
    );
    await act(async () => {});

    expect(mockChannelFn).not.toHaveBeenCalled();
    unmount();
  });

  /** Validates: m7 — cleanup unsubscribes the realtime channel */
  it("removes the realtime channel on unmount", async () => {
    const { QueryWrapper } = createWrapper();

    const { unmount } = renderHook(
      () => useConversations("tenant"),
      { wrapper: QueryWrapper },
    );

    await waitFor(() => expect(chatInsertCallback).toBeDefined());

    unmount();
    expect(mockRemoveChannel).toHaveBeenCalled();
  });

  /** Validates: realtime — re-renders never tear down / re-create the channel
   *  (supabase-js returns the joined channel for a repeated name and throws
   *  "cannot add postgres_changes callbacks after subscribe()") */
  it("subscribes only once across re-renders", async () => {
    const { QueryWrapper } = createWrapper();

    const { rerender, unmount } = renderHook(
      () => useConversations("tenant"),
      { wrapper: QueryWrapper },
    );

    await waitFor(() => expect(chatInsertCallback).toBeDefined());

    rerender({});
    rerender({});
    rerender({});

    expect(mockChannelFn).toHaveBeenCalledTimes(1);
    expect(mockRemoveChannel).not.toHaveBeenCalled();

    unmount();
    expect(mockRemoveChannel).toHaveBeenCalledWith(
      expect.objectContaining({ topic: `realtime:chat-list:${MY_ID}:tenant` }),
    );
  });

  /** Validates: realtime — a still-unregistering channel with the same identity
   *  is reused, not re-registered (registering on a joined channel throws) */
  it("reuses a live channel with the same identity instead of re-subscribing", async () => {
    const existingChannel = {
      topic: `realtime:chat-list:${MY_ID}:tenant`,
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    };
    mockGetChannels.mockReturnValue([existingChannel]);

    const { QueryWrapper } = createWrapper();

    const { unmount } = renderHook(
      () => useConversations("tenant"),
      { wrapper: QueryWrapper },
    );

    await act(async () => {});

    expect(mockChannelFn).not.toHaveBeenCalled();
    expect(existingChannel.on).not.toHaveBeenCalled();

    unmount();
    expect(mockRemoveChannel).toHaveBeenCalledWith(existingChannel);
  });
});