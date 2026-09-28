import assert from "node:assert/strict";
import { test } from "node:test";
import { preferredPortal } from "./portal-preference.ts";

test("single-role users route only to their own portal", () => {
  assert.equal(preferredPortal(["tenant"], "landlord"), "tenant");
  assert.equal(preferredPortal(["landlord"], "tenant"), "landlord");
});

test("dual-role users retain a valid selected portal", () => {
  assert.equal(preferredPortal(["tenant", "landlord"], "tenant"), "tenant");
  assert.equal(preferredPortal(["tenant", "landlord"], "landlord"), "landlord");
  assert.equal(preferredPortal(["tenant", "landlord"], "admin"), "landlord");
});

test("an invalid or empty role list never authorizes a portal", () => {
  assert.equal(preferredPortal([], "tenant"), null);
  assert.equal(preferredPortal(["admin"], "landlord"), null);
});
