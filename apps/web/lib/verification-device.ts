export type VerificationDevice = "desktop" | "android" | "ios" | "mobile";

export interface VerificationDeviceSignals {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
  coarsePointer: boolean;
  screenShortEdge: number;
  clientHints?: { mobile?: boolean; platform?: string };
}

/** Presentation only. Tablets use the same camera workflow as phones. */
export function classifyVerificationDevice(signals: VerificationDeviceSignals): VerificationDevice {
  const { userAgent, platform, maxTouchPoints, coarsePointer, screenShortEdge, clientHints } = signals;
  if (/iPhone|iPad|iPod/i.test(userAgent) || (/Mac/i.test(platform) && maxTouchPoints > 1)) return "ios";
  if (/Android/i.test(userAgent) || clientHints?.platform === "Android") return "android";
  if (clientHints?.mobile || /Mobile|Windows Phone/i.test(userAgent)) return "mobile";
  // Desktop-mode phones can hide their mobile UA. Touch + coarse primary
  // input + a phone-sized reported screen is a fallback, not viewport width.
  // Exclude touch-enabled Windows laptops, even in narrow windows.
  const PHONE_SCREEN_MAX = 600;
  if (!/Win/i.test(platform) && maxTouchPoints > 0 && coarsePointer && screenShortEdge > 0 && screenShortEdge <= PHONE_SCREEN_MAX) return "mobile";
  return "desktop";
}
