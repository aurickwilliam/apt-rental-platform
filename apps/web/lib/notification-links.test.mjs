import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

import * as conversationContacts from "./conversation-contacts.ts";

// notification-links.ts imports the conversation-key helper by bare relative
// specifier, which node's type stripping cannot resolve; transpile it like the
// other component harnesses and hand it the real helper.
function load(file, modules) {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports,
    require: (name) => {
      assert.ok(name in modules, `Missing test dependency: ${name}`);
      return modules[name];
    },
  });
  return exports;
}

const { resolveNotificationTarget } = load("./notification-links.ts", {
  "./conversation-contacts": conversationContacts,
});

/** The href half of the target, so the route table below reads as before. */
const resolveNotificationHref = (data, portal) => resolveNotificationTarget(data, portal).href;

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

test("chat lands on the portal inbox when the payload has no peer identity", () => {
  // The mobile-format conversationKey alone cannot address a web thread.
  assert.equal(
    resolveNotificationHref({ screen: "chat", conversationKey: "chat:1:a:b" }, "tenant"),
    "/tenant/messages",
  );
  assert.equal(
    resolveNotificationHref({ screen: "chat" }, "landlord"),
    "/landlord/messages",
  );
});

test("chat with a peer identity opens the exact web conversation", () => {
  const tenantTarget = resolveNotificationTarget(
    { screen: "chat", senderId: "peer-1", apartmentId: "apt-1" },
    "tenant",
  );
  assert.deepEqual(
    { ...tenantTarget },
    { href: "/tenant/messages?conversation=peer-1:apt-1", conversationTargeted: true },
  );

  // Chats without an apartment use the 'none' key segment, as the lists do.
  const landlordTarget = resolveNotificationTarget({ screen: "chat", senderId: "peer-1" }, "landlord");
  assert.deepEqual(
    { ...landlordTarget },
    { href: "/landlord/messages?conversation=peer-1:none", conversationTargeted: true },
  );
});

test("only a targeted chat conversation reports conversationTargeted", () => {
  assert.equal(
    resolveNotificationTarget({ screen: "chat", senderId: "peer-1" }, "tenant").conversationTargeted,
    true,
  );
  // Inbox fallbacks and every other screen must never acknowledge a group.
  assert.equal(
    resolveNotificationTarget({ screen: "chat", conversationKey: "chat:1:a:b" }, "tenant")
      .conversationTargeted,
    false,
  );
  assert.equal(
    resolveNotificationTarget({ screen: "payments", paymentId: "p1" }, "landlord")
      .conversationTargeted,
    false,
  );
  assert.equal(
    resolveNotificationTarget({ screen: "passport", documentId: "d1" }, "tenant")
      .conversationTargeted,
    false,
  );
  assert.equal(resolveNotificationTarget(null, "tenant").conversationTargeted, false);
});

test("admins never receive chat threads or inboxes", () => {
  const adminTarget = resolveNotificationTarget(
    { screen: "chat", senderId: "peer-1", apartmentId: "apt-1" },
    "admin",
  );
  assert.deepEqual({ ...adminTarget }, { href: null, conversationTargeted: false });
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
