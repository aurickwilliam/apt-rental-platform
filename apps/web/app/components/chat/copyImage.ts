import { attachmentDisplayUrl } from "./attachments";
import type { ChatMessage } from "./types";

/** Photos with a resolved image URL; GIFs (animated), videos and documents aren't copyable as images. */
export function canCopyImageMessage(message: ChatMessage): boolean {
  return message.message_type === "image" && Boolean(attachmentDisplayUrl(message));
}

/** The async clipboard only accepts PNG for images, so anything else is redrawn onto a canvas first. */
async function toPngBlob(source: Blob): Promise<Blob> {
  if (source.type === "image/png") return source;
  const bitmap = await createImageBitmap(source);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable.");
    context.drawImage(bitmap, 0, 0);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't encode the image."))), "image/png")
    );
  } finally {
    bitmap.close();
  }
}

/**
 * Copies a chat photo to the clipboard as an image. The ClipboardItem takes a
 * promise so the copy still counts as part of the click in Safari.
 */
export async function copyChatImage(message: ChatMessage): Promise<void> {
  const url = attachmentDisplayUrl(message);
  if (!url || typeof ClipboardItem === "undefined" || !navigator.clipboard?.write) {
    throw new Error("Copying images isn't supported in this browser.");
  }
  const png = fetch(url).then((response) => {
    if (!response.ok) throw new Error("Couldn't load the image.");
    return response.blob();
  }).then(toPngBlob);
  await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
}
