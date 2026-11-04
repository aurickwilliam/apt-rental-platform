// Mobile counterpart of web/lib/signed-lease.ts. Keep this upload contract in
// parity without importing browser code or changing the web application.
export const SIGNED_LEASE_MAX_BYTES = 10 * 1024 * 1024;
export const SIGNED_LEASE_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

const CONTENT_TYPES: Record<string, string> = {
  pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
};

export interface SignedLeaseFile {
  name: string;
  type: string;
  size: number;
}

function extensionOf(name: string): string {
  return name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
}

export function signedLeaseContentType(file: SignedLeaseFile): string | null {
  const type = CONTENT_TYPES[extensionOf(file.name)];
  return type && (!file.type || file.type.toLowerCase() === type) ? type : null;
}

export function validateSignedLeaseFile(file: SignedLeaseFile): string | null {
  if (!signedLeaseContentType(file)) return "Upload a PDF, JPG, PNG, or WebP file.";
  if (!Number.isFinite(file.size) || file.size <= 0) return "This file is empty. Choose another file.";
  if (file.size > SIGNED_LEASE_MAX_BYTES) return "Files must be 10 MB or smaller.";
  return null;
}

export function signedLeaseUploadPath(tenancyId: string, name: string, timestamp: number): string {
  return `${tenancyId}/${timestamp}.${extensionOf(name)}`;
}

export function signedLeaseStatus(path: string | null, acknowledgedAt: string | null) {
  if (!path) return "missing";
  return acknowledgedAt ? "acknowledged" : "pending";
}
