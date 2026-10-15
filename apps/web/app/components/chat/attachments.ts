/**
 * Chat attachment helpers for the web composer: validation, client-side image
 * compression and `chat-images` uploads.
 *
 * Mirrors `apps/mobile/service/chat/chatService.ts` — same bucket, same caps,
 * same path shape and the same path-vs-external-URL split for GIFs — so both
 * platforms write identical rows. Web has no native SDK, so compression uses
 * `createImageBitmap` + canvas the way `lib/avatar-upload.ts` does.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import type { MessageType } from "./types";

/** Bucket name is legacy — it also holds video and gif attachments. */
export const CHAT_IMAGES_BUCKET = "chat-images";

/** Matches the mobile cap and the `chat-images` bucket's file size limit. */
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

export const MAX_ATTACHMENTS_PER_MESSAGE = 10;

/** Mirrors mobile's 60s clip cap. */
export const MAX_VIDEO_DURATION_SECONDS = 60;

export const ATTACHMENT_SIGNED_URL_TTL_SECONDS = 60 * 60;

export const IMAGE_MAX_LONG_EDGE = 1600;
export const IMAGE_JPEG_QUALITY = 0.7;

export const THUMBNAIL_JPEG_QUALITY = 0.7;

/**
 * Caps concurrent uploads rather than firing all N at once — a 10-file
 * multi-select on a weak connection shouldn't open 10 simultaneous uploads.
 */
const MAX_CONCURRENT_UPLOADS = 3;

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
/**
 * Video types the `chat-images` bucket actually accepts.
 *
 * `video/webm` is deliberately absent. Browsers record screencasts as webm by
 * default, but the bucket rejects that type outright ("mime type video/webm is
 * not supported"), so accepting it here would only surface the failure after
 * an upload attempt. If the bucket's allowlist is widened, add webm back here
 * and to the composer's `accept` attribute in the same change.
 */
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime"];

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
};

/** A picked file held in the composer until Send. */
export interface StagedAttachment {
  /** Stable id for this staged item; also used to revoke its object URL. */
  id: string;
  file: File;
  /** `Object.createObjectURL` preview, or the remote GIF URL. */
  previewUrl: string;
  messageType: Exclude<MessageType, "text">;
  mimeType: string;
}

/** Determines the message_type from a picked file's MIME type. */
export function resolveMessageType(mimeType?: string): Exclude<MessageType, "text"> {
  if (!mimeType) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "image/gif") return "gif";
  return "image";
}

/** Shared id generator for storage filenames and batch group ids. */
export function generateAttachmentId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function randomFileName(mimeType?: string): string {
  const ext = (mimeType && EXTENSION_BY_MIME_TYPE[mimeType]) || "jpg";
  return `${generateAttachmentId()}.${ext}`;
}

/**
 * Validates one picked file. Returns a user-facing message, or null when the
 * file is acceptable. Mirrors mobile's per-file rules so both platforms reject
 * the same things.
 */
export async function validateAttachmentFile(file: File): Promise<string | null> {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

  if (!isImage && !isVideo) {
    return `"${file.name}" isn't a supported file. Choose a JPG, PNG, WebP, MP4 or MOV.`;
  }

  if (file.size > MAX_ATTACHMENT_BYTES) {
    return `"${file.name}" is larger than 25 MB.`;
  }

  if (isVideo) {
    const duration = await readVideoDuration(file);
    if (duration !== null && duration > MAX_VIDEO_DURATION_SECONDS) {
      return `"${file.name}" is longer than ${MAX_VIDEO_DURATION_SECONDS} seconds.`;
    }
  }

  return null;
}

/**
 * Reads a video's duration without decoding it. Returns null when the browser
 * can't determine it (unknown codec, or metadata isn't ready), which leaves the
 * duration check skipped rather than blocking a valid upload.
 */
function readVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const cleanup = () => {
      video.removeAttribute("src");
      video.load();
    };

    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : null;
      cleanup();
      resolve(duration);
    };
    video.onerror = () => {
      cleanup();
      resolve(null);
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Resizes (capped at `IMAGE_MAX_LONG_EDGE` on the long edge) and re-encodes an
 * image as JPEG. Uploads are binary, never base64. Returns the original file
 * unchanged when compression isn't possible (unsupported source, or a browser
 * without `createImageBitmap`) so a valid image is never blocked by it.
 */
export async function compressChatImage(file: File): Promise<File> {
  if (typeof createImageBitmap !== "function") return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  try {
    const scale = Math.min(
      1,
      IMAGE_MAX_LONG_EDGE / Math.max(bitmap.width, bitmap.height)
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", IMAGE_JPEG_QUALITY)
    );
    if (!blob) return file;

    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, {
      type: "image/jpeg",
    });
  } catch {
    return file;
  } finally {
    bitmap.close();
  }
}

/**
 * Grabs a video's first frame as a JPEG so the row carries a real thumbnail,
 * matching the `attachment_thumbnail_path` mobile already writes.
 *
 * Returns null when the frame can't be captured — a codec the browser can't
 * decode for canvas, or a `preload="metadata"` seek that never resolves. The
 * video then renders its own first frame instead, so this is an enhancement
 * and never a gate on sending.
 */
export async function captureVideoThumbnail(file: File): Promise<Blob | null> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    const ready = await new Promise<boolean>((resolve) => {
      const finish = (ok: boolean) => resolve(ok);
      // Cap the wait: a file the browser can't decode should fall back fast
      // rather than hang the send.
      const timer = setTimeout(() => finish(false), 8000);
      video.onloadeddata = () => {
        clearTimeout(timer);
        finish(true);
      };
      video.onerror = () => {
        clearTimeout(timer);
        finish(false);
      };
      video.src = url;
    });

    if (!ready || !video.videoWidth || !video.videoHeight) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", THUMBNAIL_JPEG_QUALITY)
    );
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Uploads one attachment to the private `chat-images` bucket and returns its
 * storage path. Mirrors mobile's `{senderId}/{id}.{ext}` shape.
 */
export async function uploadChatAttachment(
  supabase: SupabaseClient,
  senderId: string,
  file: File
): Promise<string> {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error("File is larger than the 25MB limit.");
  }

  const path = `${senderId}/${randomFileName(file.type)}`;
  const { error } = await supabase.storage
    .from(CHAT_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });

  if (error) throw describeUploadFailure(error, file);
  return path;
}

/**
 * Turns a storage error into a message that identifies the cause. The Supabase
 * client collapses a network-layer abort to the bare string "Failed to fetch"
 * with no status, which is indistinguishable between a CORS preflight failure,
 * a dropped connection, a mid-flight abort on a large body and a bucket-side
 * rejection with an unreadable body. Re-throwing `error.message` alone therefore
 * hid the only information needed to debug it.
 *
 * Never includes file contents — just name, type, size and the status code.
 */
function describeUploadFailure(error: Error, file: File): Error {
  const detail = error.message || "Unknown storage error";

  // The generic fetch failure: no response reached the client at all.
  if (/failed to fetch|networkerror|load failed/i.test(detail)) {
    return new Error(
      `Upload didn't reach the server (${detail}). ` +
        `The request was blocked or reset in transit — usually the file is too ` +
        `large for the network or the browser, or the bucket rejected it ` +
        `without a readable response. File: ${file.name} ` +
        `(${file.type || "unknown type"}, ${formatBytes(file.size)}).`
    );
  }

  // A structured server rejection — RLS, missing bucket, size limit.
  return new Error(
    `Upload rejected: ${detail} File: ${file.name} ` +
      `(${file.type || "unknown type"}, ${formatBytes(file.size)}).`
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** A successfully uploaded attachment, ready to be written to `chat`. */
export interface UploadedAttachment {
  /** Index of the source file in the caller's array, so a partial batch can be
   * mapped back to the right optimistic bubble. */
  index: number;
  path: string;
  messageType: Exclude<MessageType, "text">;
  mimeType: string;
  /** Video poster. Null for images/GIFs and when the frame can't be captured. */
  thumbnailPath: string | null;
}

/**
 * Uploads a batch with a bounded worker pool. Per-file failures are collected
 * rather than thrown, so one bad file doesn't discard the rest of the batch —
 * matching mobile, which filters out per-file failures. Results are returned
 * in input order, and `failures` carries the failed indexes.
 */
export async function uploadChatAttachments(
  supabase: SupabaseClient,
  senderId: string,
  files: File[]
): Promise<{ uploaded: UploadedAttachment[]; failures: { index: number; name: string }[] }> {
  const queue = files.map((file, index) => ({
    file,
    index,
    messageType: resolveMessageType(file.type),
  }));
  const uploaded: UploadedAttachment[] = [];
  const failures: { index: number; name: string }[] = [];

  const worker = async () => {
    for (;;) {
      const next = queue.shift();
      if (!next) return;

      try {
        // Images are compressed before upload; videos and GIFs pass through
        // untouched to avoid a pointless transcode of already-compressed media.
        const payload = next.messageType === "image"
          ? await compressChatImage(next.file)
          : next.file;

        const path = await uploadChatAttachment(supabase, senderId, payload);

        // Video only, and best-effort: a failed capture must not fail the send.
        let thumbnailPath: string | null = null;
        if (next.messageType === "video") {
          const frame = await captureVideoThumbnail(next.file);
          if (frame) {
            const thumbPath = await uploadChatAttachment(
              supabase,
              senderId,
              new File([frame], `thumb-${Date.now()}.jpg`, { type: "image/jpeg" })
            );
            thumbnailPath = thumbPath;
          }
        }

        uploaded.push({
          index: next.index,
          path,
          messageType: next.messageType,
          mimeType: payload.type || next.file.type,
          thumbnailPath,
        });
      } catch (err) {
        // Log the real reason — `describeUploadFailure` already reduced it to
        // status + file metadata, with no file contents.
        console.error(
          `Attachment upload failed (${next.file.name}, ${next.file.type || "unknown type"}, ${formatBytes(next.file.size)}):`,
          err instanceof Error ? err.message : err
        );
        failures.push({ index: next.index, name: next.file.name });
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(MAX_CONCURRENT_UPLOADS, queue.length) }, worker)
  );

  uploaded.sort((a, b) => a.index - b.index);
  return { uploaded, failures };
}

/**
 * Resolves this page's storage paths to signed URLs in one batch. External
 * attachment URLs (GIFs) are left untouched — they never need signing.
 */
export async function resolveAttachmentUrls(
  supabase: SupabaseClient,
  paths: string[]
): Promise<Map<string, string>> {
  const unique = [...new Set(paths)];
  const resolved = new Map<string, string>();
  if (unique.length === 0) return resolved;

  const { data, error } = await supabase.storage
    .from(CHAT_IMAGES_BUCKET)
    .createSignedUrls(unique, ATTACHMENT_SIGNED_URL_TTL_SECONDS);

  if (error) {
    console.error("Failed to sign chat attachments:", error);
    return resolved;
  }

  for (const entry of data ?? []) {
    if (entry.path && entry.signedUrl) resolved.set(entry.path, entry.signedUrl);
  }

  return resolved;
}

/** The URL a bubble should render for a message, or null when there's none. */
export function attachmentDisplayUrl(message: {
  attachment_path?: string | null;
  attachment_url?: string | null;
  resolvedUrl?: string | null;
}): string | null {
  return message.resolvedUrl ?? message.attachment_url ?? null;
}

/** True when the message carries a renderable attachment. */
export function hasAttachment(message: {
  message_type?: string | null;
  attachment_path?: string | null;
  attachment_url?: string | null;
  resolvedUrl?: string | null;
}): boolean {
  if (message.message_type === "text") return false;
  return Boolean(
    message.attachment_path || message.attachment_url || message.resolvedUrl
  );
}