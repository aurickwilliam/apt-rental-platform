import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";

const CHROME_PACKAGE = "com.android.chrome";

/**
 * Samsung Internet's custom tab treats a tap on an e-mail address as a mailto:
 * link, so choosing a Google account there opened an e-mail app instead of
 * signing in. Chrome's custom tab has no such behavior, so prefer it when it
 * is installed and fall back to the device's own browser otherwise.
 */
export async function getAuthBrowserOptions(): Promise<WebBrowser.AuthSessionOpenOptions> {
  if (Platform.OS !== "android") return {};
  try {
    const { browserPackages } = await WebBrowser.getCustomTabsSupportingBrowsersAsync();
    return browserPackages.includes(CHROME_PACKAGE) ? { browserPackage: CHROME_PACKAGE } : {};
  } catch (error) {
    console.warn("Could not list browsers for sign-in; using the default", error);
    return {};
  }
}
