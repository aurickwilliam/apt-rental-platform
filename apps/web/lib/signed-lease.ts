// Browser upload contract for signed lease agreements. One executed contract
// per tenancy, kept in the private `signed-leases` bucket at
// `{tenancyId}/{timestamp}.{ext}` (see 20261016021700_signed_lease_uploads).
// The bucket holds up to 10 MB; the web keeps the same cap. HEIC is not
// accepted by the bucket.
export const SIGNED_LEASE_MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
};

export const SIGNED_LEASE_ACCEPT =
  ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";

export interface SignedLeaseCandidate {
  name: string;
  type: string;
  size: number;
}

function extensionOf(name: string): string {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? (parts.pop() ?? "") : "";
}

/** Content type for an allowed file, or null when the file is not allowed. */
export function signedLeaseContentType(file: SignedLeaseCandidate): string | null {
  const fromExtension = ALLOWED_TYPES[extensionOf(file.name)];
  if (!fromExtension) return null;
  // A browser-reported type must agree with the extension; an empty type
  // (some OSes omit it) falls back to the extension.
  if (file.type && file.type.toLowerCase() !== fromExtension) return null;
  return fromExtension;
}

/** User-facing error for a file that breaks the upload contract, else null. */
export function validateSignedLeaseFile(file: SignedLeaseCandidate): string | null {
  if (!signedLeaseContentType(file)) return "Upload a PDF, JPG, PNG, or WebP file.";
  if (file.size <= 0) return "This file is empty. Choose another file.";
  if (file.size > SIGNED_LEASE_MAX_BYTES) return "Files must be 10 MB or smaller.";
  return null;
}

/** Storage path for a new upload; the tenancy folder is the policy scope. */
export function signedLeaseUploadPath(tenancyId: string, fileName: string, timestamp: number): string {
  return `${tenancyId}/${timestamp}.${extensionOf(fileName)}`;
}

export type SignedLeaseStatus = "missing" | "pending" | "acknowledged";

/** Where a tenancy stands on its executed contract. */
export function signedLeaseStatus(
  path: string | null | undefined,
  acknowledgedAt: string | null | undefined,
): SignedLeaseStatus {
  if (!path) return "missing";
  return acknowledgedAt ? "acknowledged" : "pending";
}
