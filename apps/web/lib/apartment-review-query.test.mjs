import assert from "node:assert/strict";
import { test } from "node:test";
import { apartmentReviewSelect } from "./apartment-review-query.ts";

test("signed-out reviews select public display fields without private tenancy joins", () => {
  const select = apartmentReviewSelect(false);
  assert.match(select, /users!reviews_tenant_id_fkey/);
  for (const field of ["id", "rating", "comment", "created_at", "image_paths", "first_name", "last_name", "avatar_url"]) {
    assert.match(select, new RegExp(`\\b${field}\\b`));
  }
  assert.doesNotMatch(select, /tenancy|lease_start|lease_end|user_id|email|mobile_number|\*/);
});

test("signed-in reviews retain policy-authorized stay dates", () => {
  const select = apartmentReviewSelect(true);
  assert.ok(select.startsWith(apartmentReviewSelect(false)));
  assert.match(select, /tenancy:tenancy_id \(lease_start, lease_end\)/);
});
