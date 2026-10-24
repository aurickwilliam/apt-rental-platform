import assert from "node:assert/strict";
import { test } from "node:test";
import { adminMfaDecision, isAdminMfaRequired, qrCodeImageSrc, toAssuranceLevel } from "./admin-mfa.ts";

test("the QR from Auth becomes a valid image src without the trailing newline", () => {
  const svg = '<?xml version="1.0"?>\n<svg width="219"><rect fill="black"/></svg>\n';
  const src = qrCodeImageSrc(`data:image/svg+xml;utf-8,${svg}`);
  assert.ok(src.startsWith("data:image/svg+xml;utf-8,"));
  assert.ok(!/[\s<>"]/.test(src), "nothing unencoded remains");
  assert.equal(decodeURIComponent(src.slice(src.indexOf(",") + 1)), svg.trim());
});

test("nothing is enforced while the flag is off", () => {
  for (const hasVerifiedFactor of [true, false]) {
    assert.equal(adminMfaDecision({ required: false, currentLevel: "aal1", hasVerifiedFactor }), "ok");
  }
});

test("a verified second step lets the admin through", () => {
  assert.equal(adminMfaDecision({ required: true, currentLevel: "aal2", hasVerifiedFactor: true }), "ok");
});

test("an admin with a device is asked for a code, one without is asked to enrol", () => {
  assert.equal(adminMfaDecision({ required: true, currentLevel: "aal1", hasVerifiedFactor: true }), "challenge");
  assert.equal(adminMfaDecision({ required: true, currentLevel: "aal1", hasVerifiedFactor: false }), "enroll");
});

test("only the exact string 'true' turns the requirement on", () => {
  assert.equal(isAdminMfaRequired("true"), true);
  for (const value of [undefined, "", "TRUE", "1", "yes", "false", " true"]) {
    assert.equal(isAdminMfaRequired(value), false);
  }
});

test("anything but aal2 is treated as the basic level", () => {
  assert.equal(toAssuranceLevel("aal2"), "aal2");
  for (const claim of ["aal1", undefined, null, "", "AAL2", 2]) {
    assert.equal(toAssuranceLevel(claim), "aal1");
  }
});
