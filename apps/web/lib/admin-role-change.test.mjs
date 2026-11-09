import assert from "node:assert/strict";
import { test } from "node:test";
import { getAdminRoleOption, isAuthenticatorCode, parseAdminRoleDecision } from "./admin-role-change.ts";

const candidate = {
  id: "target",
  roles: ["tenant"],
  account_status: "verified",
  mobile_number: "09171234567",
  is_suspended: false,
};

test("a verified, complete, active consumer can be made an admin", () => {
  assert.deepEqual(getAdminRoleOption(candidate, "viewer"), { kind: "available", decision: "grant" });
});

test("an admin with another role can have admin removed", () => {
  assert.deepEqual(
    getAdminRoleOption({ ...candidate, roles: ["admin", "landlord"] }, "viewer"),
    { kind: "available", decision: "revoke" },
  );
});

test("your own account, admin-only accounts and ineligible accounts offer nothing", () => {
  for (const user of [
    { ...candidate, id: "viewer" },
    { ...candidate, id: "viewer", roles: ["admin", "tenant"] },
    { ...candidate, roles: ["admin"] },
    { ...candidate, is_suspended: true },
    { ...candidate, account_status: "pending" },
    { ...candidate, account_status: "unverified" },
    { ...candidate, mobile_number: null },
  ]) {
    assert.equal(getAdminRoleOption(user, "viewer").kind, "unavailable");
  }
});

test("only the two decisions and a 6-digit code are accepted", () => {
  assert.equal(parseAdminRoleDecision("grant"), "grant");
  assert.equal(parseAdminRoleDecision("revoke"), "revoke");
  for (const value of ["admin", "", null, undefined]) assert.equal(parseAdminRoleDecision(value), null);
  assert.equal(isAuthenticatorCode("012345"), true);
  for (const value of ["12345", "1234567", "12a456", " 123456", null, 123456]) {
    assert.equal(isAuthenticatorCode(value), false);
  }
});
