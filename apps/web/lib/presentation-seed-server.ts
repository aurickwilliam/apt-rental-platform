import "server-only";
import type { PresentationSeed } from "@/service/presentation-seed";

/** Capture read errors as an initialized error state (Retry still performs a fresh read). */
export async function loadPresentationSeed<T>(authUserId: string, profileId: string, load: () => Promise<T>, empty: T, message: string, resourceId?: string): Promise<PresentationSeed<T>> {
  const seed: PresentationSeed<T> = { authUserId, profileId, resourceId, data: empty, error: null, renderedAt: new Date().toISOString() };
  try {
    seed.data = await load();
  } catch (error) {
    console.error(message, { name: error instanceof Error ? error.name : "ReadError" });
    seed.error = message;
  }
  return seed;
}
