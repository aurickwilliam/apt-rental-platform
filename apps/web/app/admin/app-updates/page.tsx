import { IconDeviceMobile } from "@tabler/icons-react";
import { createClient } from "@repo/supabase/server";
import { APP_RELEASE_PLATFORM } from "@repo/utils";
import { requireAdmin } from "../_lib/require-admin";
import AppReleaseForm from "./AppReleaseForm";

export const dynamic = "force-dynamic";

export default async function AppUpdatesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: release, error } = await supabase
    .from("app_releases")
    .select("latest_version, min_version, apk_url, release_notes, updated_at")
    .eq("platform", APP_RELEASE_PLATFORM)
    .maybeSingle();
  if (error) console.error("Admin app release failed to load", error);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 p-4">
      <div>
        <h1 className="flex items-center gap-2 font-nunito text-3xl font-bold text-primary">
          <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10">
            <IconDeviceMobile size={28} className="text-primary" aria-hidden="true" />
          </div>
          App updates
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell Android users a new APK is ready. Installed apps check this on launch and show an
          Update button that opens the download link.
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          The current release could not be loaded. Refresh to try again.
        </p>
      )}
      <AppReleaseForm
        current={
          release
            ? {
                latestVersion: release.latest_version,
                minVersion: release.min_version,
                apkUrl: release.apk_url,
                releaseNotes: release.release_notes ?? "",
                updatedAt: release.updated_at,
              }
            : null
        }
      />
    </div>
  );
}
