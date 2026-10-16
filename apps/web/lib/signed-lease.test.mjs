import assert from "node:assert/strict";
import { test } from "node:test";
import {
  SIGNED_LEASE_MAX_BYTES,
  signedLeaseContentType,
  signedLeaseStatus,
  signedLeaseUploadPath,
  validateSignedLeaseFile,
} from "./signed-lease.ts";

const file = (name, type, size = 1024) => ({ name, type, size });

test("accepts PDF, JPG, PNG and WebP up to 10 MB", () => {
  assert.equal(validateSignedLeaseFile(file("contract.pdf", "application/pdf")), null);
  assert.equal(validateSignedLeaseFile(file("page-1.JPG", "image/jpeg")), null);
  assert.equal(validateSignedLeaseFile(file("page-1.jpeg", "image/jpeg")), null);
  assert.equal(validateSignedLeaseFile(file("scan.png", "image/png")), null);
  assert.equal(validateSignedLeaseFile(file("scan.webp", "image/webp")), null);
  assert.equal(
    validateSignedLeaseFile(file("contract.pdf", "application/pdf", SIGNED_LEASE_MAX_BYTES)),
    null,
  );
});

test("falls back to the extension when the browser omits the type", () => {
  assert.equal(signedLeaseContentType(file("contract.pdf", "")), "application/pdf");
});

test("rejects HEIC, Word files and mismatched types", () => {
  const message = "Upload a PDF, JPG, PNG, or WebP file.";
  assert.equal(validateSignedLeaseFile(file("photo.heic", "image/heic")), message);
  assert.equal(validateSignedLeaseFile(file("contract.docx", "")), message);
  assert.equal(validateSignedLeaseFile(file("fake.pdf", "image/heic")), message);
  assert.equal(validateSignedLeaseFile(file("noext", "application/pdf")), message);
});

test("rejects empty and oversized files", () => {
  assert.equal(
    validateSignedLeaseFile(file("contract.pdf", "application/pdf", 0)),
    "This file is empty. Choose another file.",
  );
  assert.equal(
    validateSignedLeaseFile(file("contract.pdf", "application/pdf", SIGNED_LEASE_MAX_BYTES + 1)),
    "Files must be 10 MB or smaller.",
  );
});

test("builds a timestamped path inside the tenancy folder", () => {
  assert.equal(signedLeaseUploadPath("tenancy-1", "Contract Scan.PDF", 1760500000000), "tenancy-1/1760500000000.pdf");
  assert.equal(signedLeaseUploadPath("tenancy-1", "page.jpeg", 42), "tenancy-1/42.jpeg");
});

test("reports the contract status from the path and acknowledgement", () => {
  assert.equal(signedLeaseStatus(null, null), "missing");
  assert.equal(signedLeaseStatus(undefined, "2026-10-16T00:00:00Z"), "missing");
  assert.equal(signedLeaseStatus("tenancy-1/42.pdf", null), "pending");
  assert.equal(signedLeaseStatus("tenancy-1/42.pdf", "2026-10-16T00:00:00Z"), "acknowledged");
});
