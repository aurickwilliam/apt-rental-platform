import { File } from "expo-file-system";
import * as WebBrowser from "expo-web-browser";
import type { DocumentPickerAsset } from "expo-document-picker";
import { supabase } from "@repo/supabase";
import { usePortalStore } from "@/stores/usePortalStore";
import { getPrivateMediaCacheGeneration, isPrivateMediaCacheGenerationCurrent } from "@/service/media/privateMediaCache";
import { resolvePrivateMediaUrls } from "@/service/media/privateMediaResolver";
import { signedLeaseContentType, signedLeaseUploadPath, validateSignedLeaseFile } from "@/utils/signedLease";

const BUCKET = "signed-leases";

/** Retire work on sign-out/account/portal transitions, including late callbacks. */
export function signedLeaseOperationGuard() {
  const scope = usePortalStore.getState();
  const generation = getPrivateMediaCacheGeneration();
  return () => {
    const current = usePortalStore.getState();
    return current === scope && !!scope.authUserId && scope.portal === "landlord" && !current.loading
      && current.authUserId === scope.authUserId && current.portal === scope.portal
      && isPrivateMediaCacheGenerationCurrent(generation);
  };
}

async function assertSession(isCurrent: () => boolean) {
  const { data, error } = await supabase.auth.getSession();
  if (error || !isCurrent() || data.session?.user.id !== usePortalStore.getState().authUserId) {
    throw new Error("Your session has changed. Reopen this property to continue.");
  }
}

async function removeFile(path: string, isCurrent: () => boolean) {
  if (!isCurrent()) return;
  try {
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) console.warn("Signed lease cleanup failed", error.name);
  } catch {
    console.warn("Signed lease cleanup could not complete");
  }
}

export async function uploadSignedLease(input: {
  tenancyId: string;
  asset: DocumentPickerAsset;
  previousPath: string | null;
  isCurrent: () => boolean;
}): Promise<void> {
  const { tenancyId, asset, previousPath, isCurrent } = input;
  await assertSession(isCurrent);
  // Read binary from the cached local file, never base64 or a React Native Blob.
  const file = new File(asset.uri);
  const candidate = { name: asset.name, type: asset.mimeType ?? "", size: file.size };
  const validation = validateSignedLeaseFile(candidate);
  if (validation) throw new Error(validation);
  const bytes = await file.arrayBuffer();
  await assertSession(isCurrent);
  const path = signedLeaseUploadPath(tenancyId, asset.name, Date.now());
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: signedLeaseContentType(candidate)!,
  });
  if (uploadError) throw new Error("Could not upload the signed lease. Please try again.");
  await assertSession(isCurrent);

  try {
    const { error } = await supabase.rpc("set_tenancy_signed_lease", {
      p_tenancy_id: tenancyId, p_path: path,
    });
    if (error) throw error;
  } catch (saveError) {
    await assertSession(isCurrent);
    const { data, error } = await supabase.from("tenancies")
      .select("signed_lease_path").eq("id", tenancyId).maybeSingle();
    await assertSession(isCurrent);
    // Unknown outcomes must retain the new object: a successful RPC may have
    // lost its response. Only a successful read of a different path is safe.
    if (error || !data) {
      throw new Error("Could not confirm the save. Refresh this property before trying again.");
    }
    if (data.signed_lease_path !== path) {
      await removeFile(path, isCurrent);
      const message = saveError && typeof saveError === "object" && "message" in saveError
        ? String(saveError.message) : "Could not save the signed lease. Please try again.";
      throw new Error(message);
    }
  }

  await assertSession(isCurrent);
  if (previousPath && previousPath !== path) await removeFile(previousPath, isCurrent);
}

export async function viewSignedLease(path: string, isCurrent: () => boolean): Promise<void> {
  await assertSession(isCurrent);
  const { urls, error } = await resolvePrivateMediaUrls(BUCKET, [path], { forceRefreshPaths: [path] });
  await assertSession(isCurrent);
  if (error || !urls[path]) throw new Error("Could not open the signed lease. Please try again.");
  // Do not forward a private contract URL to Google Docs or another viewer.
  await WebBrowser.openBrowserAsync(urls[path]);
}
