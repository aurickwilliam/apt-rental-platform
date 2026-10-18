import {
  NOTIFICATION_PREVIEW_MAX_LENGTH,
  getNotificationPreview,
} from "./notificationPreview";

describe("getNotificationPreview", () => {
  it("reads a trimmed preview from the payload", () => {
    expect(getNotificationPreview({ messagePreview: "  Hello  " })).toBe("Hello");
    expect(getNotificationPreview({ screen: "chat", messagePreview: "Hello" })).toBe("Hello");
  });

  it("returns null for payloads without a usable preview", () => {
    expect(getNotificationPreview(null)).toBeNull();
    expect(getNotificationPreview(undefined)).toBeNull();
    expect(getNotificationPreview("Hello")).toBeNull();
    expect(getNotificationPreview({})).toBeNull();
    expect(getNotificationPreview({ screen: "chat", event: "reaction" })).toBeNull();
    expect(getNotificationPreview({ messagePreview: null })).toBeNull();
    expect(getNotificationPreview({ messagePreview: 42 })).toBeNull();
    expect(getNotificationPreview({ messagePreview: { text: "Hello" } })).toBeNull();
    expect(getNotificationPreview({ messagePreview: "   " })).toBeNull();
    expect(getNotificationPreview({ messagePreview: "\n\t" })).toBeNull();
  });

  it("clamps an over-long preview to the database length", () => {
    const overLong = `${"a".repeat(NOTIFICATION_PREVIEW_MAX_LENGTH)}tail`;
    expect(getNotificationPreview({ messagePreview: overLong })).toHaveLength(
      NOTIFICATION_PREVIEW_MAX_LENGTH,
    );
  });
});
