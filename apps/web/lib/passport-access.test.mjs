import assert from "node:assert/strict";
import { test } from "node:test";
import { passportAccessRedirect } from "./passport-access.ts";

test("verified accounts may enter the Passport", () => {
  assert.equal(passportAccessRedirect("verified", "/tenant/profile"), null);
});

test("pending accounts return to their profile", () => {
  assert.equal(passportAccessRedirect("pending", "/tenant/profile"), "/tenant/profile");
});

test("unverified, rejected and unknown accounts go to verification", () => {
  for (const status of ["unverified", "rejected", null, undefined, "something-else"]) {
    assert.equal(passportAccessRedirect(status, "/tenant/profile"), "/verify");
  }
});
