const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "heic"];
const DOCUMENT_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
];

export function getExtension(uri: string) {
  // Strip query params and fragments, then get the last segment's extension
  const cleanPath = uri.split("?")[0].split("#")[0];
  return cleanPath.split(".").pop()?.toLowerCase() ?? "";
}

export function isImageUri(uri: string): boolean {
  const ext = getExtension(uri);
  if (IMAGE_EXTENSIONS.includes(ext)) return true;
  if (DOCUMENT_EXTENSIONS.includes(ext)) return false;
  // Bundled assets (resolveAssetSource) may lose extensions — default to image
  return true;
}

/**
 * Whether a document can render an inline image preview. The stored MIME type
 * (recorded at upload) wins over URL sniffing: signed URLs don't always carry
 * a usable extension, so an image saved as e.g. `image/jpeg` previews even
 * when its URL has no image extension.
 */
export function isPreviewable(
  mimeType: string | null | undefined,
  uri: string,
): boolean {
  if (mimeType) return mimeType.toLowerCase().startsWith("image/");
  return isImageUri(uri);
}

/** Whether a document is a PDF (thumbnail via a PDF renderer). */
export function isPdfDocument(
  mimeType: string | null | undefined,
  uri: string,
): boolean {
  if (mimeType) return mimeType.toLowerCase() === "application/pdf";
  return getExtension(uri) === "pdf";
}
