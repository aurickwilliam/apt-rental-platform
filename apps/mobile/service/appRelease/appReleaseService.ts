import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Linking } from "react-native";
import { supabase } from "@repo/supabase";
import { APP_RELEASE_PLATFORM, isSecureDownloadUrl } from "@repo/utils";

const DISMISSED_UPDATE_KEY = "apt-app-update-dismissed:v1";

export interface AppRelease {
  latestVersion: string;
  minVersion: string;
  apkUrl: string;
  releaseNotes: string | null;
}

/** The version baked into this build (`version` in app.config.js). */
export function getInstalledAppVersion(): string | null {
  return Constants.expoConfig?.version ?? null;
}

/** Public read: the check runs before sign-in. A missing or malformed row means "no update". */
export async function fetchAppRelease(): Promise<AppRelease | null> {
  const { data, error } = await supabase
    .from("app_releases")
    .select("latest_version, min_version, apk_url, release_notes")
    .eq("platform", APP_RELEASE_PLATFORM)
    .maybeSingle();
  if (error) throw error;
  if (!data || !isSecureDownloadUrl(data.apk_url)) return null;
  return {
    latestVersion: data.latest_version,
    minVersion: data.min_version,
    apkUrl: data.apk_url,
    releaseNotes: data.release_notes,
  };
}

/** Opens the APK link in the browser; Android then offers to install it over the current app. */
export async function openAppDownload(apkUrl: string): Promise<void> {
  if (!isSecureDownloadUrl(apkUrl)) throw new Error("The update link is not secure.");
  await Linking.openURL(apkUrl);
}

/** Per-device only: "Maybe later" hides one version's prompt, never a newer one. */
export async function readDismissedUpdate(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(DISMISSED_UPDATE_KEY);
  } catch (error) {
    console.error("Could not read the dismissed app update", error);
    return null;
  }
}

export async function saveDismissedUpdate(version: string): Promise<void> {
  try {
    await AsyncStorage.setItem(DISMISSED_UPDATE_KEY, version);
  } catch (error) {
    console.error("Could not save the dismissed app update", error);
  }
}
