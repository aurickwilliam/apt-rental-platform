// Shared document rules for identity verification captures (mobile browser
// wizard and desktop wizard). Selfies always come from a live camera
// capture; ID images may be captured or uploaded as files.
//
// NOTE: this module stays free of workspace imports on purpose so node:test
// can load it directly. Callers pass the canonical ID lists and the
// single-page ID label from @repo/constants.

export const VERIFICATION_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

export const VERIFICATION_UPLOAD_ACCEPT = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

export interface VerificationUploadCandidate {
  name: string;
  type: string;
  size: number;
}

/** All ID types the review team accepts. */
export function allowedIdTypes(
  primaryIds: readonly string[],
  secondaryIds: readonly string[],
): string[] {
  return [...primaryIds, ...secondaryIds];
}

/** Whether the ID type is in the accepted set. */
export function isAllowedIdType(idType: string, allowedTypes: readonly string[]): boolean {
  return allowedTypes.includes(idType);
}

/** Passport submits the identity page only; every other ID needs front + back. */
export function idTypeNeedsBack(idType: string, singlePageIdType: string): boolean {
  return idType !== singlePageIdType;
}

function extensionOf(name: string): string {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? (parts.pop() ?? "") : "";
}

/** User-facing error for a verification image file, else null. */
export function validateVerificationImageFile(
  file: VerificationUploadCandidate,
): string | null {
  const ext = extensionOf(file.name);
  const fromExtension =
    ext === "jpg" || ext === "jpeg"
      ? "image/jpeg"
      : ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : null;
  if (!fromExtension) {
    return "Upload a JPG, PNG, or WebP image.";
  }
  // A browser-reported type must agree with the extension; an empty type
  // (some OSes omit it) falls back to the extension.
  if (file.type && file.type.toLowerCase() !== fromExtension) {
    return "Upload a JPG, PNG, or WebP image.";
  }
  if (file.size <= 0) return "This file is empty. Choose another file.";
  if (file.size > VERIFICATION_UPLOAD_MAX_BYTES) {
    return "Images must be 5 MB or smaller.";
  }
  return null;
}
