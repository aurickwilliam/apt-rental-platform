"use client";

import { createClient } from "@repo/supabase/browser";

export const APPLICATION_DOCUMENTS_BUCKET = "application-documents";

export const APPLICATION_DOCUMENT_SIGNED_URL_TTL_SECONDS = 60 * 60;

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
  const { data, error } = await supabase.storage
    .from(APPLICATION_DOCUMENTS_BUCKET)
    .createSignedUrls(unique, APPLICATION_DOCUMENT_SIGNED_URL_TTL_SECONDS);

  if (error) {
    return {
      urls: Object.fromEntries(unique.map((path) => [path, null])),
      error: "Unable to access private documents.",
    };
  }

  const signedByPath = new Map(
    (data ?? [])
      .filter((entry) => entry.path && entry.signedUrl && !entry.error)
      .map((entry) => [entry.path, entry.signedUrl] as const),
  );

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
