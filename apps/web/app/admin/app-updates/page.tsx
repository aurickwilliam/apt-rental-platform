import { IconDeviceMobile } from "@tabler/icons-react";
import { createClient } from "@repo/supabase/server";
import { APP_RELEASE_PLATFORM } from "@repo/utils";
import { requireAdmin } from "../_lib/require-admin";
import PublishReleaseModal from "./PublishReleaseModal";
import ReleaseHistory, { type ReleaseHistoryEntry } from "./ReleaseHistory";

export const dynamic = "force-dynamic";
const HISTORY_LIMIT = 50;

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function AppUpdatesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: release, error } = await supabase
    .from("app_releases")
    .select("latest_version, min_version, apk_url, release_notes")
    .eq("platform", APP_RELEASE_PLATFORM)
    .maybeSingle();
  if (error) console.error("Admin app release failed to load", error);

  const { data: historyRows, error: historyError } = await supabase
    .from("app_release_history")
    .select(
      `id, latest_version, min_version, apk_url, release_notes, published_at,
       publisher:users!app_release_history_published_by_fkey(first_name, last_name)`,
    )
    .eq("platform", APP_RELEASE_PLATFORM)
    .order("published_at", { ascending: false })
    .limit(HISTORY_LIMIT);
  if (historyError) console.error("Admin app release history failed to load", historyError);

  const history: ReleaseHistoryEntry[] = (historyRows ?? []).map((row) => {
    const publisher = one(row.publisher);
    return {
      id: row.id,
      latestVersion: row.latest_version,
      minVersion: row.min_version,
      apkUrl: row.apk_url,
      releaseNotes: row.release_notes,
      publishedAt: row.published_at,
      publishedBy: `${publisher?.first_name ?? ""} ${publisher?.last_name ?? ""}`.trim() || "Former admin",
    };
  });

  return (
    <div className="w-full space-y-5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-nunito text-3xl font-bold text-primary">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10">
              <IconDeviceMobile size={28} className="text-primary" aria-hidden="true" />
            </div>
            App updates
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every Android release published here, newest first. Installed apps check the current one on
            launch and show an Update button that opens its download link.
          </p>
        </div>
        <PublishReleaseModal
          current={
            release
              ? {
                  latestVersion: release.latest_version,
                  minVersion: release.min_version,
                  apkUrl: release.apk_url,
                  releaseNotes: release.release_notes ?? "",
                }
              : null
          }
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          The current release could not be loaded, so the form starts empty. Refresh to try again.
        </p>
      )}
      <ReleaseHistory entries={history} error={Boolean(historyError)} />
    </div>
  );
}
