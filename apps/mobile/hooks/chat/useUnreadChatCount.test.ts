jest.mock("./useConversations", () => ({ useConversations: jest.fn() }));

import { countUnreadConversations } from "./useUnreadChatCount";

import type { ConversationWithMeta } from "@/service/chat/conversationService";

const make = (overrides: Partial<ConversationWithMeta>): ConversationWithMeta =>
  ({
    unread_count: 0,
    is_archived: false,
    is_muted: false,
    marked_unread: false,
    ...overrides,
  }) as ConversationWithMeta;

describe("countUnreadConversations", () => {
  it("counts conversations, not messages", () => {
    expect(
      countUnreadConversations([make({ unread_count: 5 }), make({ unread_count: 1 })])
    ).toBe(2);
  });

  it("counts chats marked unread", () => {
    expect(countUnreadConversations([make({ marked_unread: true })])).toBe(1);
  });

  it("skips archived, muted and fully read chats", () => {
    expect(
      countUnreadConversations([
        make({ unread_count: 3, is_archived: true }),
        make({ unread_count: 3, is_muted: true }),
        make({}),
      ])
    ).toBe(0);
  });
});
