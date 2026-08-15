import { shouldSuppressChatToast } from "./notificationSuppression";

function messageRow(conversationKey?: string) {
  return {
    type: "message" as const,
    data: conversationKey ? { conversationKey } : {},
  };
}

const CHAT_KEY = "chat:apt-1:aaaa-bbbb:cccc-dddd";
const ENCODED_CHAT_PATH = `/chat/${encodeURIComponent(CHAT_KEY)}`;

describe("shouldSuppressChatToast", () => {
  it("suppresses message toasts for the chat currently open", () => {
    expect(shouldSuppressChatToast(messageRow(CHAT_KEY), ENCODED_CHAT_PATH)).toBe(true);
  });

  it("does not suppress message toasts for a different chat", () => {
    expect(shouldSuppressChatToast(messageRow(CHAT_KEY), `/chat/${encodeURIComponent("chat:apt-2:eeee-ffff:cccc-dddd")}`)).toBe(false);
  });

  it("does not suppress message toasts outside the chat screen", () => {
    expect(shouldSuppressChatToast(messageRow(CHAT_KEY), "/tenant/applications")).toBe(false);
  });

  it("does not suppress message toasts without a conversation key", () => {
    expect(shouldSuppressChatToast(messageRow(), ENCODED_CHAT_PATH)).toBe(false);
  });

  it("does not suppress non-message types while in a chat", () => {
    expect(
      shouldSuppressChatToast(
        { type: "payment", data: { screen: "payments" } },
        ENCODED_CHAT_PATH,
      ),
    ).toBe(false);
  });

  it("tolerates a malformed chat pathname", () => {
    expect(shouldSuppressChatToast(messageRow(CHAT_KEY), "/chat/%E0%A4%A")).toBe(false);
  });
});
