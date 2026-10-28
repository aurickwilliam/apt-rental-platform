import assert from "node:assert/strict";
import test from "node:test";
import {
  isLandlordRouteOpenWhileUnverified,
  LANDLORD_VERIFY_REQUIRED_PATH,
} from "./landlord-verification-access.ts";

test("only profile, public listing views and the wall stay open", () => {
  for (const path of [
    LANDLORD_VERIFY_REQUIRED_PATH,
    "/landlord/profile",
    "/landlord/browse/abc",
    "/landlord/browse/abc/ratings",
    "/landlord/landlords/abc",
    "/landlord/landlords/abc/reviews",
  ]) {
    assert.equal(isLandlordRouteOpenWhileUnverified(path), true, path);
  }
});

test("every landlord tool is closed", () => {
  for (const path of [
    "/landlord",
    "/landlord/dashboard",
    "/landlord/properties",
    "/landlord/properties/create",
    "/landlord/applications",
    "/landlord/maintenance-requests",
    "/landlord/messages",
    "/landlord/payments",
    "/landlord/analytics",
    "/landlord/passport",
    "/landlord/tenants/abc",
    "/landlord/visit-requests",
    "/landlord/profileish",
    "/landlord/browser",
  ]) {
    assert.equal(isLandlordRouteOpenWhileUnverified(path), false, path);
  }
});

test("a running tenancy keeps payments and maintenance open, and nothing else", () => {
  for (const path of ["/landlord/payments", "/landlord/payments/abc", "/landlord/maintenance-requests", "/landlord/maintenance-requests/abc"]) {
    assert.equal(isLandlordRouteOpenWhileUnverified(path), false, path);
    assert.equal(isLandlordRouteOpenWhileUnverified(path, true), true, path);
  }
  for (const path of ["/landlord/dashboard", "/landlord/properties/create", "/landlord/applications", "/landlord/messages", "/landlord/analytics", "/landlord/paymentsx"]) {
    assert.equal(isLandlordRouteOpenWhileUnverified(path, true), false, path);
  }
});
