import * as Clipboard from 'expo-clipboard';
import { File, Paths } from 'expo-file-system';

import type { Message } from './chatService';

const PASTED_MIME_TYPE_BY_EXTENSION: Record<string, string> = {
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
};

/** Photos with a resolved URL; GIFs (animated), videos and documents aren't copyable as images. */
export function canCopyImageMessage(
  message: Pick<Message, 'messageType' | 'attachmentUrl'>
): boolean {
  return message.messageType === 'image' && Boolean(message.attachmentUrl);
}

function cacheFile(extension: string): File {
  return new File(Paths.cache, `chat-clipboard-${Date.now()}.${extension}`);
}

/**
 * Copies a chat photo to the system clipboard. The clipboard only takes
 * base64, so the image is downloaded to the cache first and the temporary file
 * is removed afterwards.
 */
export async function copyChatImageToClipboard(url: string): Promise<void> {
  const file = await File.downloadFileAsync(url, cacheFile('img'), { idempotent: true });
  try {
    await Clipboard.setImageAsync(await file.base64());
  } finally {
    file.delete();
  }
}

/** Pasted images arrive as local files; the extension tells a GIF from a still. */
export function pastedImageMimeType(uri: string): string {
  const extension = uri.split(/[?#]/)[0].split('.').pop()?.toLowerCase();
  return (extension && PASTED_MIME_TYPE_BY_EXTENSION[extension]) || 'image/jpeg';
}
