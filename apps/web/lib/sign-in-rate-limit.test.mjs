import assert from "node:assert/strict";
import { test } from "node:test";
import { clientIpFromHeaders } from "./sign-in-rate-limit.ts";
import { signInThrottleKeys } from "./sign-in-throttle.ts";

test("prefers the platform-set headers over x-forwarded-for", () => {
  assert.equal(
    clientIpFromHeaders({
      "x-vercel-forwarded-for": "203.0.113.9",
      "x-real-ip": "203.0.113.8",
      "x-forwarded-for": "198.51.100.1, 10.0.0.1",
    }),
    "203.0.113.9",
  );
  assert.equal(
    clientIpFromHeaders({ "x-real-ip": "203.0.113.8", "x-forwarded-for": "198.51.100.1" }),
    "203.0.113.8",
  );
});

test("uses the first forwarded hop when nothing else is set", () => {
  assert.equal(
    clientIpFromHeaders({ "x-forwarded-for": "203.0.113.5, 10.0.0.1", "x-real-ip": null }),
    "203.0.113.5",
  );
});

test("falls back to empty", () => {
  assert.equal(clientIpFromHeaders({ "x-forwarded-for": null, "x-real-ip": null }), "");
  assert.equal(clientIpFromHeaders({}), "");
});

test("rejects garbage values", () => {
  assert.equal(clientIpFromHeaders({ "x-forwarded-for": "<script>", "x-real-ip": undefined }), "");
  assert.equal(clientIpFromHeaders({ "x-vercel-forwarded-for": "<script>", "x-real-ip": "198.51.100.7" }), "198.51.100.7");
});

test("sign-in keys: email+IP, email hourly, IP", () => {
  const { guard, clearOnSuccess } = signInThrottleKeys("  Ana@Example.COM ", "203.0.113.5");
  assert.deepEqual(guard, [
    { purpose: "signin_email_ip", subject: "ana@example.com|203.0.113.5" },
    { purpose: "signin_email_hour", subject: "ana@example.com" },
    { purpose: "signin_ip", subject: "203.0.113.5" },
  ]);
  assert.deepEqual(clearOnSuccess.map((k) => k.purpose), ["signin_email_ip", "signin_email_hour"]);
});

test("sign-in keys never clear the IP window and skip it when the IP is unknown", () => {
  const { guard, clearOnSuccess } = signInThrottleKeys("ana@example.com", "");
  assert.deepEqual(guard.map((k) => k.purpose), ["signin_email_ip", "signin_email_hour"]);
  assert.ok(!clearOnSuccess.some((k) => k.purpose === "signin_ip"));
});

test("sign-in keys cap an absurdly long email under the database limit", () => {
  const { guard } = signInThrottleKeys(`${"a".repeat(400)}@example.com`, "2001:db8::1");
  assert.ok(guard.every((k) => k.subject.length <= 320));
});
