import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";

import { useConversations, getConversationsQueryKey } from "./useConversations";
import { createMobileQueryClient } from "@/utils/queryClient";

import type { ConversationWithMeta } from "@/service/conversationService";

const MY_ID = "user-1";
const mockUseCurrentUser = jest.fn();
const mockFetchConversations = jest.fn();
const mockChannelFn = jest.fn();
const mockRemoveChannel = jest.fn();
let chatInsertCallback:
  | ((payload: { new?: unknown }) => void)
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
  },
}));

jest.mock("@/service/conversationService", () => ({
  fetchConversationsWithMetadata: (...args: unknown[]) =>
    mockFetchConversations(...args),
}));

const seedConversations: ConversationWithMeta[] = [
  {
    other_user_id: "other-1",
    apartment_id: "apt-1",
    last_message: "hello",
    last_message_time: "2026-01-01T00:00:00Z",
    unread_count: 0,
    conversation_key: "other-1:apt-1",
    last_sender_is_me: false,
    last_message_type: "text",
    conversation_type: "tenant",
  },
  {
    other_user_id: "other-2",
    apartment_id: "apt-2",
    last_message: "hello too",
    last_message_time: "2026-01-01T00:01:00Z",
    unread_count: 2,
    conversation_key: "other-2:apt-2",
    last_sender_is_me: true,
    last_message_type: "text",
    conversation_type: "inquiry",
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
  mockUseCurrentUser.mockReturnValue({
    data: { id: MY_ID },
    isLoading: false,
    error: null,
  });
  mockFetchConversations.mockResolvedValue(seedConversations);
  mockChannelFn.mockImplementation(() => {
    const channel = {
      on: jest.fn(),
      subscribe: jest.fn(),
    };

    channel.on.mockImplementation(
      (
        _event: string,
        filter: { table?: string },
        callback: (payload: { new?: unknown }) => void,
      ) => {
        if (filter.table === "chat") {
          chatInsertCallback = callback;
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
    client.setQueryData(getConversationsQueryKey(MY_ID), seedConversations);

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
    client.setQueryData(getConversationsQueryKey(MY_ID), seedConversations);

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

  /** Validates: m7 — unknown conversation triggers a refetch, not a corrupt merge */
  it("invalidates the query when the INSERT targets an unknown conversation", async () => {
    const { client, QueryWrapper } = createWrapper();
    const invalidateSpy = jest.spyOn(client, "invalidateQueries");
    client.setQueryData(getConversationsQueryKey(MY_ID), seedConversations);

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
        queryKey: getConversationsQueryKey(MY_ID),
        exact: true,
      }),
    );

    unmount();
  });

  /** Validates: m7 — markConversationRead zeroes only the targeted conversation */
  it("marks a single conversation read", async () => {
    const { client, QueryWrapper } = createWrapper();
    client.setQueryData(getConversationsQueryKey(MY_ID), seedConversations);

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
});