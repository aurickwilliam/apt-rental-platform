/** Per-file cap, also enforced by the private chat-images bucket. */
export const MAX_CHAT_ATTACHMENT_BYTES = 25 * 1024 * 1024;

export const CHAT_DOCUMENT_MIME_TYPES = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
} as const;

/** Browsers sometimes omit the MIME type for Office documents. */
export function chatAttachmentMimeType(file: { name: string; type: string }): string {
  const type = file.type.toLowerCase();
  if (type && type !== 'application/octet-stream') return type;
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'pdf' || extension === 'docx') return CHAT_DOCUMENT_MIME_TYPES[extension];
  return type;
}

export function isChatDocumentType(mimeType: string): boolean {
  return Object.values(CHAT_DOCUMENT_MIME_TYPES).some((type) => type === mimeType);
}

export function formatChatAttachmentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
