"use client";

import { signOut as signOutAction } from "@/app/(auth)/actions/sign-out";
import { resetBrowserResources } from "@/lib/browser-resource-cache";

/** Server cookie changes needn't emit a browser SIGNED_OUT event. Clear first. */
export function signOut() {
  resetBrowserResources();
  return signOutAction();
}
