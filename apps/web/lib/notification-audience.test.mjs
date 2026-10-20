import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getNotificationAudience,
  getVisibleUnreadIds,
  isNotificationVisibleInPortal,
} from "./notification-audience.ts";

function row(title, screen, is_read = false) {
  return {
    id: `${screen ?? "none"}:${title}`,
    type: "payment",
    title,
    message: "",
    data: screen === undefined ? null : { screen, ...(screen === "chat" ? { recipientPortal: "tenant" } : {}) },
    is_read,
    created_at: new Date().toISOString(),
  };
}

test("tenant payment and rent titles are tenant-only", () => {
  for (const title of [
    "Payment Successful",
    "Rent Due Soon",
    "Rent Due Today",
    "Rent Past Due",
  ]) {
    const n = row(title, "payments");
    assert.equal(getNotificationAudience(n), "tenant");
    assert.equal(isNotificationVisibleInPortal(n, "tenant"), true);
    assert.equal(isNotificationVisibleInPortal(n, "landlord"), false);
  }
});

test("landlord payment and rent titles are landlord-only", () => {
  for (const title of [
    "Payment Received",
    "Cash Payment Received",
    "Tenant Rent Due Soon",
    "Tenant Rent Due Today",
    "Tenant Rent Overdue",
  ]) {
    const n = row(title, "payments");
    assert.equal(getNotificationAudience(n), "landlord");
    assert.equal(isNotificationVisibleInPortal(n, "tenant"), false);
    assert.equal(isNotificationVisibleInPortal(n, "landlord"), true);
  }
});

test("maintenance and visit titles follow the recipient role", () => {
  assert.equal(
    getNotificationAudience(row("New Maintenance Request", "maintenance")),
    "landlord",
  );
  assert.equal(
    getNotificationAudience(row("Maintenance Resolved", "maintenance")),
    "tenant",
  );
  assert.equal(
    getNotificationAudience(row("New Visit Request", "visitRequests")),
    "landlord",
  );
  assert.equal(
    getNotificationAudience(row("Visit Approved", "visitRequests")),
    "tenant",
  );
});

test("application outcomes are tenant rows, submissions are landlord rows", () => {
  assert.equal(
    getNotificationAudience(row("Application Approved", "apartment")),
    "tenant",
  );
  assert.equal(
    getNotificationAudience(row("New Application", "application")),
    "landlord",
  );
});

test("chat is portal-specific while Passport and account outcomes retain their audiences", () => {
  for (const n of [
    row("Juan Dela Cruz", "chat"),
    row("Account verification approved", "verification"),
    row("Document verified", "passport"),
  ]) {
    assert.equal(getNotificationAudience(n), n.data.screen === "chat" ? "tenant" : n.data.screen === "verification" ? "account" : "both");
    assert.equal(isNotificationVisibleInPortal(n, "tenant"), true);
    assert.equal(isNotificationVisibleInPortal(n, "landlord"), n.data.screen !== "chat");
  }
});

test("admin-audience rows are hidden in consumer portals, visible in admin", () => {
  for (const n of [
    row("New account verification submitted", "verification"),
    row("New apartment verification submitted", "verification"),
    row("New passport document submitted", "passportReview"),
  ]) {
    assert.equal(getNotificationAudience(n), "admin");
    assert.equal(isNotificationVisibleInPortal(n, "tenant"), false);
    assert.equal(isNotificationVisibleInPortal(n, "landlord"), false);
    assert.equal(isNotificationVisibleInPortal(n, "admin"), true);
  }
});

test("apartment verification outcomes are landlord-only, not own-account updates", () => {
  for (const title of ["Apartment verification approved", "Apartment verification rejected"]) {
    const n = row(title, "verification");
    assert.equal(getNotificationAudience(n), "landlord");
    assert.equal(isNotificationVisibleInPortal(n, "tenant"), false);
    assert.equal(isNotificationVisibleInPortal(n, "admin"), false);
  }
});

test("tenant and landlord rows never surface in the admin portal", () => {
  const tenantRow = row("Payment Successful", "payments");
  const landlordRow = row("New Visit Request", "visitRequests");
  assert.equal(isNotificationVisibleInPortal(tenantRow, "admin"), false);
  assert.equal(isNotificationVisibleInPortal(landlordRow, "admin"), false);
  assert.equal(isNotificationVisibleInPortal(row("Juan Dela Cruz", "chat"), "admin"), false);
  // Explicitly identified account-level rows remain visible in Admin.
  for (const n of [
    row("Account verification approved", "verification"),
  ]) {
    assert.equal(isNotificationVisibleInPortal(n, "admin"), true);
  }
});

test("unrecognized payloads stay visible instead of being hidden", () => {
  const cases = [
    row("Some future title", "payments"),
    row("Anything", "unknown-screen"),
    row("No screen at all"),
    { ...row("Bad shape", "payments"), data: "not-an-object" },
  ];
  for (const n of cases) {
    assert.equal(isNotificationVisibleInPortal(n, "tenant"), true);
    assert.equal(isNotificationVisibleInPortal(n, "landlord"), true);
  }
});

test("dual-role switching keeps each portal's unread set independent", () => {
  const feed = [
    { ...row("Payment Successful", "payments"), id: "t1" },
    { ...row("Payment Received", "payments"), id: "l1" },
    { ...row("Juan Dela Cruz", "chat"), id: "c1" },
    { ...row("Payment Successful", "payments", true), id: "t2" },
  ];
  assert.deepEqual(getVisibleUnreadIds(feed, "tenant"), ["t1", "c1"]);
  assert.deepEqual(getVisibleUnreadIds(feed, "landlord"), ["l1"]);
});

test("mark-all-read scope never touches the other portal or read rows", () => {
  const feed = [
    { ...row("Payment Received", "payments"), id: "l1" },
    { ...row("Payment Successful", "payments"), id: "t1" },
  ];
  const ids = getVisibleUnreadIds(feed, "landlord");
  assert.deepEqual(ids, ["l1"]);
});

test("Admin excludes messages and unresolved legacy chat is not shared across portals", () => {
  for (const n of [
    { ...row("Sender", "chat"), type: "message" },
    { ...row("Sender", "chat"), data: { screen: "chat", event: "reaction" } },
    { ...row("Sender"), type: "message" },
    { ...row("Sender"), type: "message", data: "chat" },
    { ...row("Sender"), type: "message", data: [] },
    { ...row("Sender"), data: { event: "reaction" } },
    { ...row("Sender"), type: "message", data: { screen: 42, audience: "admin" } },
  ]) {
    assert.equal(isNotificationVisibleInPortal(n, "admin"), false);
    assert.equal(isNotificationVisibleInPortal(n, "tenant"), n.data?.recipientPortal === "tenant");
    assert.equal(isNotificationVisibleInPortal(n, "landlord"), false);
  }
});

test("unknown consumer titles and explicit portal metadata never become account-wide", () => {
  for (const screen of ["payments", "maintenance", "application", "apartment", "visitRequests", "passport", "verification"]) {
    assert.equal(isNotificationVisibleInPortal(row("Future subtype", screen), "admin"), false, screen);
  }
  for (const key of ["portal", "audience"]) {
    for (const portal of ["tenant", "landlord", "admin"]) {
      const n = { ...row("Future event", "unknown"), type: "system", data: { screen: "unknown", [key]: portal } };
      for (const active of ["tenant", "landlord", "admin"]) {
        assert.equal(isNotificationVisibleInPortal(n, active), active === portal);
      }
    }
  }
  for (const n of [
    row("Unknown event", "unknown"),
    { ...row("Unknown"), type: "system", data: null },
    { ...row("Unknown"), data: { screen: 7 } },
    { ...row("Unknown"), data: ["chat"] },
  ]) {
    assert.equal(isNotificationVisibleInPortal(n, "admin"), false);
    assert.equal(isNotificationVisibleInPortal(n, "tenant"), true);
    assert.equal(isNotificationVisibleInPortal(n, "landlord"), true);
  }
});

test("a shared three-role account has distinct unread sets with known account-wide outcomes", () => {
  const feed = [
    { ...row("Sender", "chat"), id: "chat", type: "message" },
    { ...row("Sender", "chat"), id: "reaction", type: "message", data: { screen: "chat", event: "reaction", recipientPortal: "landlord" } },
    { ...row("Payment Successful", "payments"), id: "tenant" },
    { ...row("Payment Received", "payments"), id: "landlord" },
    { ...row("New account verification submitted", "verification"), id: "review" },
    { ...row("New apartment verification submitted", "verification"), id: "apartment-review" },
    { ...row("New passport document submitted", "passportReview"), id: "passport-review" },
    { ...row("Account verification approved", "verification"), id: "account" },
  ];
  assert.deepEqual(getVisibleUnreadIds(feed, "admin"), ["review", "apartment-review", "passport-review", "account"]);
  assert.deepEqual(getVisibleUnreadIds(feed, "tenant"), ["chat", "tenant", "account"]);
  assert.deepEqual(getVisibleUnreadIds(feed, "landlord"), ["reaction", "landlord", "account"]);
});
