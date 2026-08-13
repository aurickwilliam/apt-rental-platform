import { supabase } from '@repo/supabase';
import { getRelativeTime } from '@repo/utils';
import { File } from 'expo-file-system';

import emojiRegex from 'emoji-regex-xs';

import {
  PRIVATE_MEDIA_SIGNED_URL_TTL_SECONDS,
  resolvePrivateMediaUrls,
} from './privateMediaResolver';

// ─── Types ──────────────────────────────────────────────────────────────────

export type MessageType = 'text' | 'image' | 'video' | 'gif';

export type Message = {
  id: string;
  message: string | null;
  messageType: MessageType;
  attachmentUrl: string | null;
  attachmentPath: string | null;
  attachmentMimeType?: string | null;
  thumbnailUrl?: string | null;
  thumbnailPath?: string | null;
  groupId?: string | null;
  timestamp: string;
  isSent: boolean;
  isPending?: boolean;
};

/** A message freshly sent through sendChatAttachments — carries the original
 * localUri so the caller can match it back to its optimistic pending bubble. */
export type SentChatAttachment = Message & { localUri: string };

/** A locally-picked image/video/gif, staged for upload. */
export type PickedChatAsset = {
  localUri: string;
  mimeType?: string;
  /** Local poster-frame uri for video, generated client-side via expo-video-thumbnails. */
  thumbnailUri?: string;
  /** Remote URL (e.g. Giphy CDN) — skips storage upload; the URL is stored verbatim. */
  externalUrl?: string;
};

export type UploadedChatAttachment = {
  /** Ties the result back to the originally picked asset, for optimistic-UI reconciliation. */
  localUri: string;
  /** Null for external-URL assets (no storage upload happened). */
  attachmentPath: string | null;
  /** Set for external-URL assets only — rendered directly, no signing needed. */
  attachmentUrl?: string;
  messageType: Exclude<MessageType, 'text'>;
  mimeType?: string;
  thumbnailPath?: string;
};

export type AttachmentUploadFailure = {
  localUri: string;
  error: string;
};

export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
};

export type Conversation = {
  conversation_key: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  other_user_phone: string | null;
  apartment_id: string | null;
  apartment_name: string | null;
  last_message: string | null;
  last_message_type: MessageType | null;
  last_message_time: string;
  unread_count: number;
  /** Authoritative sender of the latest message — provided by get_conversations_v2. */
  last_sender_id: string | null;
  conversation_type: 'tenant' | 'inquiry';
};

// ─── Constants ──────────────────────────────────────────────────────────────

// Bucket name is legacy — it now also holds video and gif attachments, not just images.
const CHAT_IMAGES_BUCKET = 'chat-images';
const SIGNED_URL_TTL_SECONDS = PRIVATE_MEDIA_SIGNED_URL_TTL_SECONDS;
const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024; // must match chat-images bucket file_size_limit

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
};

// Cap concurrent uploads rather than firing all N at once — an 8-photo
// multi-select on a weak connection shouldn't open 8 simultaneous uploads.
const MAX_CONCURRENT_ATTACHMENT_UPLOADS = 3;

// ─── Text messages ──────────────────────────────────────────────────────────

export const CHAT_MESSAGES_PAGE_SIZE = 30;

export type ChatMessageCursor = {
  createdAt: string;
  id: string;
};

export type ChatMessagePage = {
  messages: Message[];
  nextCursor: ChatMessageCursor | null;
};

function buildOlderThanChatMessageFilter(cursor: ChatMessageCursor): string {
  return `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`;
}

/**
 * Fetches one newest-first page for a conversation. The secondary ID sort and
 * strict composite cursor retain a deterministic sequence when timestamps tie.
 */
export async function fetchMessagePage(params: {
  currentUserId: string;
  otherUserId: string;
  apartmentId: string | null;
  cursor?: ChatMessageCursor | null;
  pageSize?: number;
}): Promise<ChatMessagePage> {
  const pageSize = params.pageSize ?? CHAT_MESSAGES_PAGE_SIZE;
  let query = supabase
    .from('chat')
    .select(
      'id, message, message_type, attachment_path, attachment_url, attachment_mime_type, attachment_thumbnail_path, group_id, created_at, sender_id, receiver_id, apartment_id'
    )
    .or(
      `and(sender_id.eq.${params.currentUserId},receiver_id.eq.${params.otherUserId}),and(sender_id.eq.${params.otherUserId},receiver_id.eq.${params.currentUserId})`
    )
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  query = params.apartmentId
    ? query.eq('apartment_id', params.apartmentId)
    : query.is('apartment_id', null);

  if (params.cursor) {
    query = query.or(buildOlderThanChatMessageFilter(params.cursor));
  }

  const { data, error } = await query.limit(pageSize);
  if (error) throw error;

  const rows = data ?? [];
  const lastRow = rows.at(-1);

  return {
    messages: await mapMessages(rows, params.currentUserId),
    nextCursor:
      rows.length === pageSize && lastRow
        ? { createdAt: lastRow.created_at, id: lastRow.id }
        : null,
  };
}

/** Compatibility adapter for callers that only need the initial bounded page. */
export async function fetchMessages(
  currentUserId: string,
  otherUserId: string,
  apartmentId: string | null
): Promise<Message[]> {
  const page = await fetchMessagePage({ currentUserId, otherUserId, apartmentId });
  return page.messages;
}

export async function insertMessage(params: {
  senderId: string;
  receiverId: string;
  apartmentId: string | null;
  message: string;
}) {
  if (!params.apartmentId) {
    throw new Error('Chat requires apartmentId');
  }

  const { data, error } = await supabase
    .from('chat')
    .insert({
      sender_id: params.senderId,
      receiver_id: params.receiverId,
      apartment_id: params.apartmentId,
      message_type: 'text',
      message: params.message,
      is_read: false,
    })
    .select('id, message, message_type, created_at, sender_id')
    .single();

  if (error) throw error;
  return data;
}

export async function markMessagesAsRead(
  currentUserId: string,
  otherUserId: string,
  apartmentId: string | null
) {
  let query = supabase
    .from('chat')
    .update({ is_read: true })
    .eq('receiver_id', currentUserId)
    .eq('sender_id', otherUserId)
    .eq('is_read', false);

  query = apartmentId ? query.eq('apartment_id', apartmentId) : query.is('apartment_id', null);

  const { error } = await query;
  if (error) throw error;
}

// ─── Attachment upload primitives ──────────────────────────────────────────
// Single-file building blocks — storage upload, signed URL resolution. Every
// attachment send (single photo or multi-select) routes through these via
// uploadChatAttachments below.

/** Determines the message_type from a picked asset's mimeType. Falls back to 'image'. */
export function resolveMessageType(mimeType?: string): Exclude<MessageType, 'text'> {
  if (!mimeType) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'image/gif') return 'gif';
  return 'image';
}

/** Narrow an arbitrary stored value to MessageType; null for anything unknown. */
export function toMessageType(value: string | null | undefined): MessageType | null {
  return value === 'text' || value === 'image' || value === 'video' || value === 'gif'
    ? value
    : null;
}

/** Shared id generator for storage filenames and batch group ids — kept in one place so both stay consistent. */
function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function randomFileName(mimeType?: string) {
  const ext = (mimeType && EXTENSION_BY_MIME_TYPE[mimeType]) || 'jpg';
  return `${generateId()}.${ext}`;
}

/** Uploads a locally-picked image/video/gif to the private chat-images bucket and returns its storage path. */
export async function uploadChatAttachment(
  senderId: string,
  localUri: string,
  mimeType?: string
): Promise<string> {
  const file = new File(localUri);
  const bytes = await file.bytes();

  if (bytes.byteLength > MAX_ATTACHMENT_BYTES) {
    throw new Error('File is larger than the 25MB limit.');
  }

  const path = `${senderId}/${randomFileName(mimeType)}`;

  const { error } = await supabase.storage
    .from(CHAT_IMAGES_BUCKET)
    .upload(path, bytes, { contentType: mimeType ?? 'image/jpeg', upsert: false });

  if (error) throw error;
  return path;
}

/** Uploads a generated video poster frame (jpg) and returns its storage path. */
export async function uploadChatThumbnail(senderId: string, localUri: string): Promise<string> {
  const file = new File(localUri);
  const bytes = await file.bytes();

  const path = `${senderId}/thumb-${generateId()}.jpg`;

  const { error } = await supabase.storage
    .from(CHAT_IMAGES_BUCKET)
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: false });

  if (error) throw error;
  return path;
}

/** Batch-resolves chat storage paths to cached, time-limited URLs, keyed by path. */
export async function getChatAttachmentSignedUrls(paths: string[]): Promise<Record<string, string>> {
  const { urls } = await resolvePrivateMediaUrls(CHAT_IMAGES_BUCKET, paths);

  return Object.fromEntries(
    Object.entries(urls).filter((entry): entry is [string, string] => entry[1] !== null)
  );
}

// ─── Attachment send (single or multi-select) ──────────────────────────────
// Every attachment send — one photo or an eight-photo multi-select — goes
// through this same pipeline: upload each asset, bulk-insert one chat row
// per attachment, then resolve signed URLs for the result. group_id ties
// together rows sent as one batch and is left null for a lone attachment.
// See the add_chat_group_id migration.

/**
 * Uploads a batch of picked assets (and their thumbnails, if any) to the
 * private chat-images bucket, via uploadChatAttachment / uploadChatThumbnail
 * per file. Failures are collected, not thrown — one bad file in a batch of
 * 8 shouldn't sink the other 7.
 */
export async function uploadChatAttachments(
  senderId: string,
  assets: PickedChatAsset[]
): Promise<{ uploaded: UploadedChatAttachment[]; failed: AttachmentUploadFailure[] }> {
  const uploaded: UploadedChatAttachment[] = [];
  const failed: AttachmentUploadFailure[] = [];
  const queue = [...assets];

  async function worker(): Promise<void> {
    let asset: PickedChatAsset | undefined;
    while ((asset = queue.shift())) {
      try {
        if (asset.externalUrl) {
          // Giphy-style pick: the CDN URL is the attachment — no storage upload.
          uploaded.push({
            localUri: asset.localUri,
            attachmentPath: null,
            attachmentUrl: asset.externalUrl,
            messageType: resolveMessageType(asset.mimeType),
            mimeType: asset.mimeType,
          });
          continue;
        }

        const messageType = resolveMessageType(asset.mimeType);
        const attachmentPath = await uploadChatAttachment(senderId, asset.localUri, asset.mimeType);

        let thumbnailPath: string | undefined;
        if (asset.thumbnailUri) {
          try {
            thumbnailPath = await uploadChatThumbnail(senderId, asset.thumbnailUri);
          } catch {
            // A missing thumbnail shouldn't fail the whole attachment —
            // mapMessages already handles a null thumbnailUrl gracefully.
          }
        }

        uploaded.push({
          localUri: asset.localUri,
          attachmentPath,
          messageType,
          mimeType: asset.mimeType,
          thumbnailPath,
        });
      } catch (err) {
        failed.push({
          localUri: asset.localUri,
          error: err instanceof Error ? err.message : 'Upload failed',
        });
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(MAX_CONCURRENT_ATTACHMENT_UPLOADS, assets.length) }, worker)
  );

  return { uploaded, failed };
}

/**
 * Bulk-inserts one `chat` row per uploaded attachment in a single round trip,
 * tagged with a shared group_id so the client can render them as one cluster.
 * group_id is left null when there's only one upload.
 */
export async function insertAttachmentMessagesBatch(params: {
  senderId: string;
  receiverId: string;
  apartmentId: string | null;
  uploads: UploadedChatAttachment[];
}) {
  if (!params.apartmentId) {
    throw new Error('Chat requires apartmentId');
  }
  if (params.uploads.length === 0) return [];

  const groupId = params.uploads.length > 1 ? generateId() : null;

  const rows = params.uploads.map((u) => ({
    sender_id: params.senderId,
    receiver_id: params.receiverId,
    apartment_id: params.apartmentId,
    message_type: u.messageType,
    attachment_path: u.attachmentPath,
    attachment_url: u.attachmentUrl ?? null,
    attachment_mime_type: u.mimeType ?? null,
    attachment_thumbnail_path: u.thumbnailPath ?? null,
    group_id: groupId,
    is_read: false,
  }));

  const { data, error } = await supabase
    .from('chat')
    .insert(rows)
    .select(
      'id, message_type, attachment_path, attachment_url, attachment_mime_type, attachment_thumbnail_path, group_id, created_at, sender_id'
    );

  if (error) throw error;
  return data;
}

/**
 * Orchestrates a full attachment send: upload -> bulk insert -> resolve
 * signed URLs for both the attachments and any generated thumbnails. Returns
 * ready-to-render Message objects (as SentChatAttachment, carrying the
 * original localUri so useChat's handleSendImages can match each one back to
 * its optimistic pending bubble) plus any per-file upload failures, so one
 * bad file doesn't sink the rest of the batch.
 */
export async function sendChatAttachments(params: {
  senderId: string;
  receiverId: string;
  apartmentId: string | null;
  assets: PickedChatAsset[];
}): Promise<{ sent: SentChatAttachment[]; failed: AttachmentUploadFailure[] }> {
  const { uploaded, failed } = await uploadChatAttachments(params.senderId, params.assets);

  if (uploaded.length === 0) {
    return { sent: [], failed };
  }

  try {
    const inserted = await insertAttachmentMessagesBatch({
      senderId: params.senderId,
      receiverId: params.receiverId,
      apartmentId: params.apartmentId,
      uploads: uploaded,
    });

    const attachmentPaths = inserted
      .map((r) => r.attachment_path)
      .filter((p): p is string => !!p);
    const thumbnailPaths = inserted
      .map((r) => r.attachment_thumbnail_path)
      .filter((p): p is string => !!p);

    const [signedUrls, thumbnailUrls] = await Promise.all([
      getChatAttachmentSignedUrls(attachmentPaths),
      getChatAttachmentSignedUrls(thumbnailPaths),
    ]);

    const uploadByPath = new Map<string | null, UploadedChatAttachment>(
      uploaded.map((u) => [u.attachmentPath, u])
    );

    const sent: SentChatAttachment[] = inserted.map((row) => {
      const upload = row.attachment_path
        ? uploadByPath.get(row.attachment_path)
        : uploadByPath.get(null);
      return {
        id: row.id,
        message: null,
        messageType: row.message_type as MessageType,
        attachmentUrl: row.attachment_url ?? (row.attachment_path ? (signedUrls[row.attachment_path] ?? null) : null),
        attachmentPath: row.attachment_path ?? null,
        attachmentMimeType: row.attachment_mime_type ?? null,
        thumbnailUrl: row.attachment_thumbnail_path
          ? (thumbnailUrls[row.attachment_thumbnail_path] ?? null)
          : null,
        thumbnailPath: row.attachment_thumbnail_path ?? null,
        groupId: row.group_id ?? null,
        timestamp: new Date(row.created_at).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isSent: true,
        localUri: upload?.localUri ?? '',
      };
    });

    return { sent, failed };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Failed to send messages';
    return {
      sent: [],
      failed: [...failed, ...uploaded.map((u) => ({ localUri: u.localUri, error }))],
    };
  }
}

// ─── Conversations ────────────────────────────────────────────────────────────

export async function getConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase.rpc('get_conversations', {
    p_user_id: userId,
  });

  if (error) throw error;

  return (data as Conversation[]).sort(
    (a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
  );
}

/**
 * Hardened conversation list: zero-argument RPC whose caller identity is
 * derived from auth.uid() server-side, so no user ID is ever client-supplied.
 * Returns authoritative last_sender_id / last_message_type / conversation_type,
 * removing the need for the client-side chat/tenancies metadata scan.
 */
export async function getConversationsV2(): Promise<Conversation[]> {
  const { data, error } = await supabase.rpc('get_conversations_v2');

  if (error) throw error;

  return (data as Conversation[]).sort(
    (a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
  );
}

// ─── User profile ─────────────────────────────────────────────────────────────

export async function fetchOtherUserProfile(otherUserId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, avatar_url')
    .eq('id', otherUserId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    firstName: data.first_name ?? '',
    lastName: data.last_name ?? '',
    avatarUrl: data.avatar_url ?? null,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export async function mapMessages(rows: any[], currentUserId: string): Promise<Message[]> {
  const attachmentPaths = rows
    .filter((m) => m.attachment_path)
    .map((m) => m.attachment_path as string);

  const thumbnailPaths = rows
    .filter((m) => m.attachment_thumbnail_path)
    .map((m) => m.attachment_thumbnail_path as string);

  const [signedUrls, thumbnailUrls] = await Promise.all([
    getChatAttachmentSignedUrls(attachmentPaths),
    getChatAttachmentSignedUrls(thumbnailPaths),
  ]);

  return rows.map((m) => ({
    id: m.id,
    message: m.message,
    messageType: (m.message_type ?? 'text') as MessageType,
    attachmentUrl: m.attachment_url ?? (m.attachment_path ? (signedUrls[m.attachment_path] ?? null) : null),
    attachmentPath: m.attachment_path ?? null,
    attachmentMimeType: m.attachment_mime_type ?? null,
    thumbnailUrl: m.attachment_thumbnail_path
      ? (thumbnailUrls[m.attachment_thumbnail_path] ?? null)
      : null,
    thumbnailPath: m.attachment_thumbnail_path ?? null,
    groupId: m.group_id ?? null,
    timestamp: getRelativeTime(new Date(m.created_at)),
    isSent: m.sender_id === currentUserId,
  }));
}

export function buildConversationKey(
  userAId: string,
  userBId: string,
  apartmentId: string | null
) {
  const [first, second] = [userAId, userBId].sort();
  return `chat:${apartmentId ?? 'none'}:${first}:${second}`;
}

// Helper function for checking if a string contains only emojis (and whitespace)
export function isEmojiOnly(text: string | null | undefined) {
  if (!text) return false;

  const trimmed = text.trim();

  if (!trimmed) return false;

  const regex = emojiRegex();

  // Remove every emoji
  const withoutEmoji = trimmed.replace(regex, '');

  // Remove spaces/newlines/variation selectors
  const cleaned = withoutEmoji
    .replace(/[\uFE0F\u200D]/g, '')
    .trim();

  return cleaned.length === 0;
}
