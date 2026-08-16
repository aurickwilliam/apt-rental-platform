import { buildNotificationDeepLink } from "./notificationDeepLink";

const USER_ID = "user-1";

describe("buildNotificationDeepLink", () => {
  it("returns null for unknown or missing screens", () => {
    expect(buildNotificationDeepLink(null, USER_ID, "tenant")).toBeNull();
    expect(buildNotificationDeepLink({ screen: "unknown" }, USER_ID, "tenant")).toBeNull();
    expect(buildNotificationDeepLink({}, USER_ID, "tenant")).toBeNull();
  });

  it("routes apartment notifications to the apartment screen", () => {
    expect(buildNotificationDeepLink(
      { screen: "apartment", apartmentId: "apt-1" },
      USER_ID,
      "tenant",
    )).toEqual("/apartment/apt-1");
  });

  it("requires an apartmentId for apartment notifications", () => {
    expect(buildNotificationDeepLink({ screen: "apartment" }, USER_ID, "tenant")).toBeNull();
  });

  describe("chat", () => {
    it("routes to the chat screen with a parsed conversation key", () => {
      const href = buildNotificationDeepLink(
        {
          screen: "chat",
          conversationKey: "chat:apt-1:aaaa-bbbb:cccc-dddd",
        },
        "cccc-dddd",
        "tenant",
      );

      expect(href).toEqual({
        pathname: "/chat/[conversationId]",
        params: {
          conversationId: "chat:apt-1:aaaa-bbbb:cccc-dddd",
          otherUserId: "aaaa-bbbb",
          otherUserPhoneNumber: "",
          apartmentId: "apt-1",
          apartmentTitle: "",
        },
      });
    });

    it("routes to the chat with the other participant when the current user is the least-sorted id", () => {
      const href = buildNotificationDeepLink(
        {
          screen: "chat",
          conversationKey: "chat:apt-1:aaaa-bbbb:cccc-dddd",
        },
        "aaaa-bbbb",
        "tenant",
      );

      expect(href).toEqual({
        pathname: "/chat/[conversationId]",
        params: {
          conversationId: "chat:apt-1:aaaa-bbbb:cccc-dddd",
          otherUserId: "cccc-dddd",
          otherUserPhoneNumber: "",
          apartmentId: "apt-1",
          apartmentTitle: "",
        },
      });
    });

    it("returns null when both participants are the current user", () => {
      expect(buildNotificationDeepLink(
        { screen: "chat", conversationKey: "chat:none:me:me" },
        "me",
        "tenant",
      )).toBeNull();
    });
  });

  describe("maintenance", () => {
    it("routes tenants to maintenance history with the apartmentId", () => {
      expect(buildNotificationDeepLink(
        { screen: "maintenance", apartmentId: "apt-1" },
        USER_ID,
        "tenant",
      )).toEqual({
        pathname: "/tenant/maintenance-history",
        params: { apartmentId: "apt-1" },
      });
    });

    it("returns null for tenants without an apartmentId", () => {
      expect(buildNotificationDeepLink({ screen: "maintenance" }, USER_ID, "tenant")).toBeNull();
    });

    it("routes landlords to maintenance requests", () => {
      expect(buildNotificationDeepLink({ screen: "maintenance" }, USER_ID, "landlord")).toBe(
        "/landlord/maintenance-requests",
      );
    });
  });

  describe("visitRequests", () => {
    it("routes tenants to their applications", () => {
      expect(buildNotificationDeepLink({ screen: "visitRequests" }, USER_ID, "tenant")).toBe(
        "/tenant/applications",
      );
    });

    it("routes landlords to visit requests", () => {
      expect(buildNotificationDeepLink({ screen: "visitRequests" }, USER_ID, "landlord")).toBe(
        "/landlord/visit-requests",
      );
    });
  });

  describe("payments", () => {
    it("routes tenants to the payment detail when a paymentId is present", () => {
      expect(buildNotificationDeepLink(
        { screen: "payments", paymentId: "pay-1" },
        USER_ID,
        "tenant",
      )).toEqual({
        pathname: "/tenant/payment/history/[paymentId]",
        params: { paymentId: "pay-1" },
      });
    });

    it("routes tenants to payment history without a paymentId", () => {
      expect(buildNotificationDeepLink({ screen: "payments" }, USER_ID, "tenant")).toBe(
        "/tenant/payment/history",
      );
    });

    it("routes landlords to the apartment payment history", () => {
      expect(buildNotificationDeepLink(
        { screen: "payments", apartmentId: "apt-1" },
        USER_ID,
        "landlord",
      )).toBe("/landlord/manage-apartment/apt-1/payment-history");
    });

    it("returns null for landlords without an apartmentId", () => {
      expect(buildNotificationDeepLink({ screen: "payments" }, USER_ID, "landlord")).toBeNull();
    });
  });
});
