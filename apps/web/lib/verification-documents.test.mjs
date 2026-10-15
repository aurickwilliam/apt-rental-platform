import assert from "node:assert/strict";
import { test } from "node:test";
import {
  VERIFICATION_UPLOAD_MAX_BYTES,
  allowedIdTypes,
  idTypeNeedsBack,
  isAllowedIdType,
  validateVerificationImageFile,
} from "./verification-documents.ts";

const file = (name, type, size = 1024) => ({ name, type, size });

test("accepts every known ID type and nothing else", () => {
  const all = allowedIdTypes(["Passport", "Driver’s License"], ["Company ID"]);
  assert.deepEqual(all, ["Passport", "Driver’s License", "Company ID"]);
  assert.equal(isAllowedIdType("Passport", all), true);
  assert.equal(isAllowedIdType("Driver’s License", all), true);
  assert.equal(isAllowedIdType("Company ID", all), true);
  assert.equal(isAllowedIdType("Library Card", all), false);
  assert.equal(isAllowedIdType("", all), false);
});

test("only the single-page ID skips the back photo", () => {
  assert.equal(idTypeNeedsBack("Passport", "Passport"), false);
  assert.equal(idTypeNeedsBack("Driver’s License", "Passport"), true);
  assert.equal(idTypeNeedsBack("Company ID", "Passport"), true);
});

test("accepts JPG, PNG and WebP up to 5 MB", () => {
  assert.equal(validateVerificationImageFile(file("id.jpg", "image/jpeg")), null);
  assert.equal(validateVerificationImageFile(file("id.JPEG", "image/jpeg")), null);
  assert.equal(validateVerificationImageFile(file("id.png", "image/png")), null);
  assert.equal(validateVerificationImageFile(file("id.webp", "image/webp")), null);
  assert.equal(
    validateVerificationImageFile(file("id.jpg", "image/jpeg", VERIFICATION_UPLOAD_MAX_BYTES)),
    null,
  );
});

test("rejects PDFs, mismatched types, empty and oversized files", () => {
  assert.match(
    validateVerificationImageFile(file("id.pdf", "application/pdf")) ?? "",
    /JPG, PNG, or WebP/,
  );
  assert.match(
    validateVerificationImageFile(file("id.png", "image/jpeg")) ?? "",
    /JPG, PNG, or WebP/,
  );
  assert.match(validateVerificationImageFile(file("id.jpg", "image/jpeg", 0)) ?? "", /empty/);
  assert.match(
    validateVerificationImageFile(file("id.jpg", "image/jpeg", VERIFICATION_UPLOAD_MAX_BYTES + 1)) ?? "",
    /5 MB/,
  );
});

test("falls back to the extension when the browser omits the type", () => {
  assert.equal(validateVerificationImageFile(file("id.png", "")), null);
});
