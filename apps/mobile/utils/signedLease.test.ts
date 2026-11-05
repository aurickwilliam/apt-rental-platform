import { SIGNED_LEASE_MAX_BYTES, signedLeaseContentType, signedLeaseStatus, signedLeaseUploadPath, validateSignedLeaseFile } from "./signedLease";

const valid = { name: "lease.pdf", type: "application/pdf", size: 100 };

it.each([
  ["lease.PDF", "application/pdf"], ["lease.jpg", "image/jpeg"],
  ["lease.jpeg", "image/jpeg"], ["lease.png", "image/png"], ["lease.webp", "image/webp"],
])("accepts %s with the web upload contract", (name, type) => {
  expect(validateSignedLeaseFile({ ...valid, name, type })).toBeNull();
  expect(signedLeaseContentType({ ...valid, name, type: "" })).toBe(type);
});

it.each(["lease.heic", "lease.docx", "lease", "lease.pdf.exe"])("refuses %s", (name) => {
  expect(validateSignedLeaseFile({ ...valid, name })).toBe("Upload a PDF, JPG, PNG, or WebP file.");
});

it("refuses MIME mismatches and empty/oversized files, including missing native sizes", () => {
  expect(validateSignedLeaseFile({ ...valid, type: "image/jpeg" })).toBeTruthy();
  for (const size of [0, -1, NaN]) expect(validateSignedLeaseFile({ ...valid, size })).toBeTruthy();
  expect(validateSignedLeaseFile({ ...valid, size: SIGNED_LEASE_MAX_BYTES })).toBeNull();
  expect(validateSignedLeaseFile({ ...valid, size: SIGNED_LEASE_MAX_BYTES + 1 })).toBe("Files must be 10 MB or smaller.");
});

it("uses the tenancy folder and the three web statuses", () => {
  expect(signedLeaseUploadPath("tenancy", "SCAN.JPG", 123)).toBe("tenancy/123.jpg");
  expect(signedLeaseStatus(null, "date")).toBe("missing");
  expect(signedLeaseStatus("path", null)).toBe("pending");
  expect(signedLeaseStatus("path", "date")).toBe("acknowledged");
});
