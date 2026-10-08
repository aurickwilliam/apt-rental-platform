"use client";

import { createClient } from "@repo/supabase/browser";

export const APPLICATION_DOCUMENTS_BUCKET = "application-documents";

export const APPLICATION_DOCUMENT_SIGNED_URL_TTL_SECONDS = 60 * 60;

// Identity captures attached from the APT Passport live in a separate private
// bucket and get a shorter-lived signed URL.
export const VERIFICATION_BUCKET = "user-verification";
export const VERIFICATION_ID_SIGNED_URL_TTL_SECONDS = 15 * 60;

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const VERIFIED_ID_FRONT_PATH = new RegExp(`^${UUID}/${UUID}/id-front\\.(jpe?g|png|webp)$`, "i");

/** `{users.id}/{verification id}/id-front.*` — never an application upload shape. */
export function isVerifiedIdFrontPath(path: string): boolean {
  return VERIFIED_ID_FRONT_PATH.test(path);
}

const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

function contentTypeFor(fileName: string, fallback: string): string {
  if (fallback) return fallback;
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return MIME_MAP[ext] ?? "application/octet-stream";
}

export type ApplicationDocKey = "govId" | "proofOfIncome" | "proofOfBilling" | "nbiClearance";

export async function uploadApplicationDocument(
  file: File,
  tenantId: string,
  folderId: string,
  docKey: ApplicationDocKey,
): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${tenantId}/${folderId}/${docKey}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(APPLICATION_DOCUMENTS_BUCKET)
    .upload(path, file, { contentType: contentTypeFor(file.name, file.type) });

  if (error) throw new Error(`Failed to upload ${docKey}: ${error.message}`);

  return path;
}

export async function removeApplicationDocuments(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(APPLICATION_DOCUMENTS_BUCKET)
    .remove(paths);
  if (error) {
    console.warn("Cleanup failed for", paths, error.message);
  }
}

export async function resolveApplicationDocumentUrls(
  paths: readonly string[],
): Promise<{ urls: Record<string, string | null>; error: string | null }> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return { urls: {}, error: null };

  const supabase = createClient();
  const signedByPath = new Map<string, string>();
  const groups = [
    {
      bucket: APPLICATION_DOCUMENTS_BUCKET,
      ttl: APPLICATION_DOCUMENT_SIGNED_URL_TTL_SECONDS,
      paths: unique.filter((path) => !isVerifiedIdFrontPath(path)),
    },
    {
      bucket: VERIFICATION_BUCKET,
      ttl: VERIFICATION_ID_SIGNED_URL_TTL_SECONDS,
      paths: unique.filter(isVerifiedIdFrontPath),
    },
  ];

  for (const group of groups) {
    if (group.paths.length === 0) continue;
    const { data, error } = await supabase.storage
      .from(group.bucket)
      .createSignedUrls(group.paths, group.ttl);

    if (error) {
      return {
        urls: Object.fromEntries(unique.map((path) => [path, null])),
        error: "Unable to access private documents.",
      };
    }

    for (const entry of data ?? []) {
      if (entry.path && entry.signedUrl && !entry.error) {
        signedByPath.set(entry.path, entry.signedUrl);
      }
    }
  }

  let hasMissing = false;
  const urls: Record<string, string | null> = {};
  for (const path of unique) {
    const signedUrl = signedByPath.get(path);
    if (!signedUrl) {
      urls[path] = null;
      hasMissing = true;
    } else {
      urls[path] = signedUrl;
    }
  }

  return {
    urls,
    error: hasMissing ? "Some private documents could not be accessed." : null,
  };
}

/**
 * Returns the subset of the given storage paths that are verified passport
 * documents for a tenant. RLS scopes rows to the landlord's own applicants.
 */
export async function fetchPassportVerifiedPaths(
  tenantId: string,
  paths: readonly string[],
): Promise<Set<string>> {
  const unique = [...new Set(paths.filter(Boolean))];
  if (!tenantId || unique.length === 0) return new Set();

  const supabase = createClient();
  const { data, error } = await supabase
    .from("passport_documents")
    .select("storage_path")
    .eq("user_id", tenantId)
    .in("storage_path", unique)
    .eq("is_verified", true);

  if (error) return new Set();
  return new Set(
    ((data ?? []) as { storage_path: string }[]).map((row) => row.storage_path),
  );
}
