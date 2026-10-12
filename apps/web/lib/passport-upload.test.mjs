import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PASSPORT_UPLOAD_MAX_BYTES,
  passportUploadContentType,
  validatePassportUploadFile,
} from "./passport-upload.ts";

const file = (name, type, size = 1024) => ({ name, type, size });

test("accepts JPG, PNG, WebP and PDF up to 5 MB", () => {
  assert.equal(validatePassportUploadFile(file("id.jpg", "image/jpeg")), null);
  assert.equal(validatePassportUploadFile(file("id.JPEG", "image/jpeg")), null);
  assert.equal(validatePassportUploadFile(file("bill.png", "image/png")), null);
  assert.equal(validatePassportUploadFile(file("bill.webp", "image/webp")), null);
  assert.equal(validatePassportUploadFile(file("payslip.pdf", "application/pdf", PASSPORT_UPLOAD_MAX_BYTES)), null);
});

test("falls back to the extension when the browser omits the type", () => {
  assert.equal(passportUploadContentType(file("payslip.pdf", "")), "application/pdf");
});

test("rejects HEIC, Word files and mismatched types", () => {
  const message = "Upload a JPG, PNG, WebP, or PDF file.";
  assert.equal(validatePassportUploadFile(file("photo.heic", "image/heic")), message);
  assert.equal(validatePassportUploadFile(file("coe.docx", "")), message);
  assert.equal(validatePassportUploadFile(file("fake.pdf", "image/heic")), message);
  assert.equal(validatePassportUploadFile(file("noext", "image/jpeg")), message);
});

test("rejects empty and oversized files", () => {
  assert.equal(validatePassportUploadFile(file("id.jpg", "image/jpeg", 0)), "This file is empty. Choose another file.");
  assert.equal(
    validatePassportUploadFile(file("id.jpg", "image/jpeg", PASSPORT_UPLOAD_MAX_BYTES + 1)),
    "Files must be 5 MB or smaller.",
  );
});
