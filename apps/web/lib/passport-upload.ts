// Browser upload contract for APT Passport documents. The bucket allows up to
// 10 MB; the web keeps mobile's 5 MB cap. HEIC is not accepted by the bucket.
export const PASSPORT_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
};

export const PASSPORT_UPLOAD_ACCEPT = ".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf";

export interface PassportUploadCandidate {
  name: string;
  type: string;
  size: number;
}

function extensionOf(name: string): string {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? (parts.pop() ?? "") : "";
}

/** Content type for an allowed file, or null when the file is not allowed. */
export function passportUploadContentType(file: PassportUploadCandidate): string | null {
  const fromExtension = ALLOWED_TYPES[extensionOf(file.name)];
  if (!fromExtension) return null;
  // A browser-reported type must agree with the extension; an empty type
  // (some OSes omit it) falls back to the extension.
  if (file.type && file.type.toLowerCase() !== fromExtension) return null;
  return fromExtension;
}

/** User-facing error for a file that breaks the upload contract, else null. */
export function validatePassportUploadFile(file: PassportUploadCandidate): string | null {
  if (!passportUploadContentType(file)) {
    return "Upload a JPG, PNG, WebP, or PDF file.";
  }
  if (file.size <= 0) return "This file is empty. Choose another file.";
  if (file.size > PASSPORT_UPLOAD_MAX_BYTES) return "Files must be 5 MB or smaller.";
  return null;
}
