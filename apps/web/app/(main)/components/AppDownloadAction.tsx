import { fetchAndroidApkUrl } from "@/lib/android-apk-url";

import { createClient } from "@repo/supabase/server";

import AppDownloadButton from "./AppDownloadButton";

type AppDownloadActionProps = Pick<React.ComponentProps<typeof AppDownloadButton>, "variant" | "hideWhenUnavailable">;

export default async function AppDownloadAction(props: AppDownloadActionProps) {
  const apkUrl = await fetchAndroidApkUrl(await createClient());

  return <AppDownloadButton isAvailable={apkUrl !== null} {...props} />;
}
