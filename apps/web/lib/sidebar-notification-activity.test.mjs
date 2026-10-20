import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as audience from "./notification-audience.ts";

const exports = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL("./sidebar-notification-activity.ts", import.meta.url), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS },
}).outputText, { exports, require: () => audience });
const { getSidebarActivityKey, getUnreadSidebarActivity } = exports;
const row = (screen, title = "Activity", type = "system", data = {}) => ({
  id: `${screen}:${title}`, title, type, is_read: false,
  data: { screen, ...(screen === "chat" ? { recipientPortal: "tenant" } : {}), ...data },
});

test("tenant events map to exactly one relevant section", () => {
  for (const [n, expected] of [
    [row("apartment", "Application Approved", "apartment", { apartmentId: "apt" }), "rental"],
    [row("apartment", "Application Rejected", "apartment", { apartmentId: "apt" }), "rental"],
    [row("payments", "Payment Successful", "payment"), "rental"],
    [row("payments", "Rent Due Today", "payment"), "rental"],
    [row("visitRequests", "Visit Approved"), "rental"],
    [row("maintenance", "Maintenance Resolved", "maintenance"), "maintenance"],
    [row("chat", "Actor name", "message"), "messages"],
    [row("chat", "Actor name", "message", { event: "reaction" }), "messages"],
    [row("passport", "Passport document rejected", "system", { documentId: "doc" }), "passport"],
    [row("verification", "Account verification approved", "system", { verificationId: "id" }), "passport"],
  ]) assert.equal(getSidebarActivityKey(n, "tenant"), expected, n.title);
});

test("landlord equivalents and property verification do not spill into Passport", () => {
  for (const [n, expected] of [
    [row("application", "New Application", "apartment", { applicationId: "app" }), "applications"],
    [row("payments", "Cash Payment Received", "payment"), "payments"],
    [row("maintenance", "New Maintenance Request", "maintenance"), "maintenance"],
    [row("chat", "Actor", "message", { event: "reaction", recipientPortal: "landlord" }), "messages"],
    [row("passport", "Passport document verified", "system", { documentId: "doc" }), "passport"],
    [row("verification", "Apartment verification approved", "system", { apartmentId: "apt" }), "properties"],
    [row("verification", "Apartment verification rejected", "system", { apartmentId: "apt" }), "properties"],
  ]) assert.equal(getSidebarActivityKey(n, "landlord"), expected, n.title);
  assert.equal(getSidebarActivityKey(row("visitRequests", "New Visit Request"), "landlord"), null);
});

test("admin supports only review-submission notifications", () => {
  for (const n of [
    row("verification", "New account verification submitted", "system", { verificationId: "id" }),
    row("verification", "New apartment verification submitted", "system", { apartmentId: "apt" }),
    row("passportReview", "New passport document submitted", "system", { documentId: "doc" }),
  ]) {
    assert.equal(getSidebarActivityKey(n, "admin"), "verification");
    assert.equal(getSidebarActivityKey(n, "tenant"), null);
    assert.equal(getSidebarActivityKey(n, "landlord"), null);
  }
  assert.equal(getSidebarActivityKey(row("chat", "Actor", "message"), "admin"), null);
  assert.equal(getSidebarActivityKey(row("verification", "Account verification approved", "system", { verificationId: "id" }), "admin"), null);
});

test("dual-role accounts retain portal audience boundaries", () => {
  const tenant = row("payments", "Payment Successful", "payment");
  const landlord = row("payments", "Payment Received", "payment");
  assert.equal(getSidebarActivityKey(tenant, "landlord"), null);
  assert.equal(getSidebarActivityKey(landlord, "tenant"), null);
  assert.equal(getSidebarActivityKey(row("verification", "Apartment verification approved", "system", { apartmentId: "apt" }), "tenant"), null);
});

test("ambiguous verification, legacy admin payloads and malformed metadata stay drawer-only", () => {
  for (const n of [
    row("verification", "Unknown", "system", { apartmentId: "apt" }),
    row("verification", "Account verification approved", "system", { verificationId: "id", apartmentId: "apt" }),
    row("verification", "New account verification submitted", "system", { verificationId: "id", apartmentId: "apt" }),
    row("verification", "Account verification approved"),
    row("passport", "New passport document submitted", "system", { documentId: "doc" }),
    row("passport", "Passport document verified", "system", { documentId: " " }),
    row("unknown", "Payment Successful", "payment"),
    { ...row("chat"), data: null }, { ...row("chat"), data: "chat" }, { ...row("chat"), data: [] },
  ]) for (const portal of ["tenant", "landlord", "admin"]) assert.equal(getSidebarActivityKey(n, portal), null);
});

test("unread activity is a boolean set; read state removes it without unrelated destinations", () => {
  const a = row("payments", "Payment Successful", "payment");
  const b = row("chat", "Actor", "message");
  assert.deepEqual([...getUnreadSidebarActivity([a, a, b], "tenant")], ["rental", "messages"]);
  assert.deepEqual([...getUnreadSidebarActivity([{ ...a, is_read: true }, b], "tenant")], ["messages"]);
  assert.deepEqual([...getUnreadSidebarActivity([{ ...a, is_read: true }, { ...b, is_read: true }], "tenant")], []);
  assert.deepEqual([...getUnreadSidebarActivity([a], null)], []);
});

test("three-role Admin activity ignores chats, reactions and unknown consumer subtypes", () => {
  const chat = row("chat", "Sender", "message");
  const reaction = row("chat", "Sender reaction", "message", { event: "reaction" });
  const review = row("verification", "New account verification submitted", "system", { verificationId: "id" });
  const feed = [chat, reaction, row("payments", "Future payment", "payment"), review];
  assert.deepEqual([...getUnreadSidebarActivity(feed, "admin")], ["verification"]);
  assert.equal(getSidebarActivityKey(reaction, "admin"), null);
  assert.equal(getSidebarActivityKey(reaction, "tenant"), "messages");
  assert.equal(getSidebarActivityKey(reaction, "landlord"), null);
  assert.deepEqual([...getUnreadSidebarActivity(feed.map(notification =>
    notification === review ? { ...notification, is_read: true } : notification,
  ), "admin")], []);
});

test("resolved legacy chat illuminates only the recipient portal and unresolved chat never adds a dot", () => {
  const landlord = { ...row("chat", "sire", "message", { event: "reaction" }),
    data: { screen: "chat", event: "reaction" }, resolvedChatAudience: "landlord" };
  const tenant = { ...row("chat", "image", "message"), data: { screen: "chat" }, resolvedChatAudience: "tenant" };
  const unknown = { ...row("chat", "unknown", "message"), data: { screen: "chat" }, resolvedChatAudience: "unresolved" };
  assert.deepEqual([...getUnreadSidebarActivity([landlord, unknown], "tenant")], []);
  assert.deepEqual([...getUnreadSidebarActivity([landlord, unknown], "landlord")], ["messages"]);
  assert.deepEqual([...getUnreadSidebarActivity([tenant, unknown], "tenant")], ["messages"]);
  assert.deepEqual([...getUnreadSidebarActivity([tenant, unknown], "landlord")], []);
  assert.deepEqual([...getUnreadSidebarActivity([landlord, tenant, unknown], "admin")], []);
});
