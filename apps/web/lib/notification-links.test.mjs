import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveNotificationHref } from "./notification-links.ts";

test("payments resolve to the portal's payment surface", () => {
  assert.equal(
    resolveNotificationHref({ screen: "payments", paymentId: "p1" }, "landlord"),
    "/landlord/payments/p1",
  );
  assert.equal(
    resolveNotificationHref({ screen: "payments" }, "landlord"),
    "/landlord/payments",
  );
  // No tenant payment-detail route exists, so the history list is the target.
  assert.equal(
    resolveNotificationHref({ screen: "payments", paymentId: "p1" }, "tenant"),
    "/tenant/payment/history",
  );
});

test("maintenance resolves to detail when an id is present", () => {
  assert.equal(
    resolveNotificationHref({ screen: "maintenance", maintenanceId: "m1" }, "landlord"),
    "/landlord/maintenance-requests/m1",
  );
  assert.equal(
    resolveNotificationHref({ screen: "maintenance" }, "landlord"),
    "/landlord/maintenance-requests",
  );
  assert.equal(
    resolveNotificationHref({ screen: "maintenance" }, "tenant"),
    "/tenant/maintenance",
  );
});

test("application and apartment screens stay in their own portal", () => {
  assert.equal(
    resolveNotificationHref(
      { screen: "application", applicationId: "a1" },
      "landlord",
    ),
    "/landlord/applications/a1",
  );
  assert.equal(resolveNotificationHref({ screen: "application" }, "tenant"), null);
  assert.equal(
    resolveNotificationHref({ screen: "apartment", apartmentId: "x1" }, "tenant"),
    "/tenant/browse/x1",
  );
  assert.equal(
    resolveNotificationHref({ screen: "apartment", apartmentId: "x1" }, "landlord"),
    null,
  );
});

test("visit requests land on the portal's visit surface", () => {
  assert.equal(
    resolveNotificationHref({ screen: "visitRequests", visitRequestId: "v1" }, "landlord"),
    "/landlord/visit-requests/v1",
  );
  assert.equal(
    resolveNotificationHref({ screen: "visitRequests" }, "tenant"),
    "/tenant/applications",
  );
});

test("chat lands on the portal inbox (thread keys are mobile-format)", () => {
  assert.equal(
    resolveNotificationHref({ screen: "chat", conversationKey: "chat:1:a:b" }, "tenant"),
    "/tenant/messages",
  );
  assert.equal(
    resolveNotificationHref({ screen: "chat" }, "landlord"),
    "/landlord/messages",
  );
});

test("verification outcomes land on the portal profile", () => {
  assert.equal(
    resolveNotificationHref({ screen: "verification" }, "tenant"),
    "/tenant/profile",
  );
  assert.equal(
    resolveNotificationHref({ screen: "verification" }, "landlord"),
    "/landlord/profile",
  );
});

test("admin review rows deep-link to the verification queue", () => {
  assert.equal(
    resolveNotificationHref({ screen: "verification", verificationId: "v1" }, "admin"),
    "/admin/verification/users/v1",
  );
  assert.equal(
    resolveNotificationHref({ screen: "verification" }, "admin"),
    "/admin/verification",
  );
  assert.equal(
    resolveNotificationHref({ screen: "passportReview", documentId: "d1" }, "admin"),
    "/admin/verification/documents/d1",
  );
  assert.equal(
    resolveNotificationHref({ screen: "passportReview" }, "admin"),
    "/admin/verification",
  );
});

test("consumer-only screens resolve nowhere in the admin portal", () => {
  assert.equal(resolveNotificationHref({ screen: "payments" }, "admin"), null);
  assert.equal(resolveNotificationHref({ screen: "maintenance" }, "admin"), null);
  assert.equal(resolveNotificationHref({ screen: "application" }, "admin"), null);
  assert.equal(resolveNotificationHref({ screen: "apartment", apartmentId: "x1" }, "admin"), null);
  assert.equal(resolveNotificationHref({ screen: "visitRequests" }, "admin"), null);
  assert.equal(resolveNotificationHref({ screen: "chat" }, "admin"), null);
  assert.equal(resolveNotificationHref({ screen: "passport" }, "admin"), null);
});
test("passport rows land on the portal wallet, admin screens resolve nowhere", () => {
  assert.equal(
    resolveNotificationHref({ screen: "passport", documentId: "d1" }, "tenant"),
    "/tenant/passport/d1",
  );
  assert.equal(
    resolveNotificationHref({ screen: "passport" }, "landlord"),
    "/landlord/passport",
  );
  assert.equal(
    resolveNotificationHref({ screen: "passportReview", documentId: "d1" }, "tenant"),
    null,
  );
  assert.equal(resolveNotificationHref({ screen: "system" }, "tenant"), null);
});

test("malformed payloads never produce a destination", () => {
  assert.equal(resolveNotificationHref(null, "tenant"), null);
  assert.equal(resolveNotificationHref("nope", "landlord"), null);
  assert.equal(resolveNotificationHref({}, "tenant"), null);
  assert.equal(resolveNotificationHref({ screen: 42 }, "tenant"), null);
});
