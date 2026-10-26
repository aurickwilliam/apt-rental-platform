import { useCallback, useState } from "react";
import { useAppUpdate } from "@/hooks/appRelease/useAppUpdate";
import { openAppDownload } from "@/service/appRelease/appReleaseService";
import AppUpdateDialog from "./AppUpdateDialog";
import AppUpdateRequiredScreen from "./AppUpdateRequiredScreen";

/** Mounted once at the root, above sign-in: sideloaded builds have no store to announce updates. */
export default function AppUpdateGate() {
  const { release, installedVersion, isRequired, isOffered, dismiss } = useAppUpdate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openDownload = useCallback(() => {
    if (!release) return;
    setErrorMessage(null);
    openAppDownload(release.apkUrl).catch((error: unknown) => {
      console.error("Could not open the app download", error);
      setErrorMessage("The download link could not be opened. Please try again.");
    });
  }, [release]);

  if (!release) return null;
  if (isRequired) {
    return (
      <AppUpdateRequiredScreen
        installedVersion={installedVersion}
        latestVersion={release.latestVersion}
        releaseNotes={release.releaseNotes}
        errorMessage={errorMessage}
        onUpdate={openDownload}
      />
    );
  }
  if (!isOffered) return null;
  return (
    <AppUpdateDialog
      latestVersion={release.latestVersion}
      releaseNotes={release.releaseNotes}
      errorMessage={errorMessage}
      onUpdate={openDownload}
      onDismiss={dismiss}
    />
  );
}
