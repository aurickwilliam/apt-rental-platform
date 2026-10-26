import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getAppUpdateStatus } from "@repo/utils";
import {
  fetchAppRelease,
  getInstalledAppVersion,
  readDismissedUpdate,
  saveDismissedUpdate,
} from "@/service/appRelease/appReleaseService";

export const APP_RELEASE_QUERY_KEY = ["app-release", "android"] as const;

/**
 * Compares this build with the published release. Only sideloaded Android
 * builds use it. A failed check never blocks anyone: no data means no prompt.
 */
export function useAppUpdate() {
  const query = useQuery({
    queryKey: APP_RELEASE_QUERY_KEY,
    queryFn: fetchAppRelease,
    enabled: Platform.OS === "android",
  });
  // undefined until the device value has loaded, so "Maybe later" never flashes the dialog.
  const [dismissedVersion, setDismissedVersion] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    void readDismissedUpdate().then((version) => { if (active) setDismissedVersion(version); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (query.error) console.warn("Could not check for an app update", query.error);
  }, [query.error]);

  const release = query.data ?? null;
  const installedVersion = getInstalledAppVersion();
  const status = release && installedVersion ? getAppUpdateStatus(installedVersion, release) : "up_to_date";

  const dismiss = useCallback(() => {
    if (!release) return;
    setDismissedVersion(release.latestVersion);
    void saveDismissedUpdate(release.latestVersion);
  }, [release]);

  return {
    release,
    installedVersion,
    isRequired: status === "required",
    isOffered: status === "optional" && dismissedVersion !== undefined && dismissedVersion !== release?.latestVersion,
    dismiss,
  };
}
