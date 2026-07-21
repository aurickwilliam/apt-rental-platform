import { supabase } from '@repo/supabase';
import { getRelativeTime } from '@repo/utils';
import { File } from 'expo-file-system';

import emojiRegex from 'emoji-regex-xs';

export type MessageType = 'text' | 'image' | 'video' | 'gif';

export type Message = {
  id: string;
  message: string | null;
  messageType: MessageType;
  attachmentUrl: string | null;
  attachmentMimeType?: string | null;
  thumbnailUrl?: string | null;
  timestamp: string;
  isSent: boolean;
  isPending?: boolean;
};

export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
};

// Bucket name is legacy — it now also holds video and gif attachments, not just images.
const CHAT_IMAGES_BUCKET = 'chat-images';
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour
const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024; // must match chat-images bucket file_size_limit

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function getCurrentUserProfile(): Promise<{ id: string } | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('user_id', user.id)
    .single();

  return data ?? null;
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function fetchMessages(
  currentUserId: string,
  otherUserId: string,
  apartmentId: string | null
): Promise<Message[]> {
  let query = supabase
    .from('chat')
    .select(
      'id, message, message_type, attachment_path, attachment_mime_type, attachment_thumbnail_path, created_at, sender_id, receiver_id, apartment_id'
    )
    .or(
      `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
    )
    .order('created_at', { ascending: false });

  query = apartmentId ? query.eq('apartment_id', apartmentId) : query.is('apartment_id', null);

  const { data, error } = await query;
  if (error) throw error;

  return mapMessages(data ?? [], currentUserId);
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

/** Inserts an image, video, or gif message. All three reuse attachment_path the same way. */
export async function insertAttachmentMessage(params: {
  senderId: string;
  receiverId: string;
  apartmentId: string | null;
  messageType: Exclude<MessageType, 'text'>;
  attachmentPath: string;
  attachmentMimeType?: string;
  attachmentThumbnailPath?: string | null;
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
      message_type: params.messageType,
      attachment_path: params.attachmentPath,
      attachment_mime_type: params.attachmentMimeType ?? null,
      attachment_thumbnail_path: params.attachmentThumbnailPath ?? null,
      is_read: false,
    })
    .select(
      'id, message_type, attachment_path, attachment_mime_type, attachment_thumbnail_path, created_at, sender_id'
    )
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

// ─── Chat attachments (image / video / gif) ───────────────────────────────────

/** Determines the message_type from a picked asset's mimeType. Falls back to 'image'. */
export function resolveMessageType(mimeType?: string): Exclude<MessageType, 'text'> {
  if (!mimeType) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'image/gif') return 'gif';
  return 'image';
}

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
};

function randomFileName(mimeType?: string) {
  const ext = (mimeType && EXTENSION_BY_MIME_TYPE[mimeType]) || 'jpg';
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${id}.${ext}`;
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

  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const path = `${senderId}/thumb-${id}.jpg`;

  const { error } = await supabase.storage
    .from(CHAT_IMAGES_BUCKET)
    .upload(path, bytes, { contentType: 'image/jpeg', upsert: false });

  if (error) throw error;
  return path;
}

/** Resolves a single storage path to a time-limited signed URL for display. */
export async function getChatAttachmentSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(CHAT_IMAGES_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error) throw error;
  return data.signedUrl;
}

/** Batch-resolves storage paths to signed URLs, keyed by path. */
async function getChatAttachmentSignedUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};

  const { data, error } = await supabase.storage
    .from(CHAT_IMAGES_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

  if (error) throw error;

  return Object.fromEntries(
    (data ?? [])
      .filter((d) => d.signedUrl && !d.error)
      .map((d) => [d.path as string, d.signedUrl as string])
  );
}

// ─── Conversations ────────────────────────────────────────────────────────────

export type Conversation = {
  conversation_key: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  other_user_phone: string | null;
  apartment_id: string | null;
  apartment_name: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  conversation_type: 'tenant' | 'inquiry';
};

export async function getConversations(userId: string): Promise<Conversation[]> {
  const { data, error } = await supabase.rpc('get_conversations', {
    p_user_id: userId,
  });

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
    attachmentUrl: m.attachment_path ? (signedUrls[m.attachment_path] ?? null) : null,
    attachmentMimeType: m.attachment_mime_type ?? null,
    thumbnailUrl: m.attachment_thumbnail_path
      ? (thumbnailUrls[m.attachment_thumbnail_path] ?? null)
      : null,
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
