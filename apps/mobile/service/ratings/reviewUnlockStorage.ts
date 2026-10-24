import AsyncStorage from "@react-native-async-storage/async-storage";

export function reviewUnlockDismissalKey(authUserId: string, tenancyId: string): string {
  return `apt-review-unlock:v1:${authUserId}:${tenancyId}`;
}

export async function readReviewUnlockDismissals(authUserId: string, tenancyIds: readonly string[]): Promise<Set<string>> {
  if (!tenancyIds.length) return new Set();
  const entries = await AsyncStorage.multiGet(tenancyIds.map(id => reviewUnlockDismissalKey(authUserId, id)));
  return new Set(tenancyIds.filter((_, index) => entries[index][1] !== null));
}

export function markReviewUnlockSeen(authUserId: string, tenancyId: string): Promise<void> {
  return AsyncStorage.setItem(reviewUnlockDismissalKey(authUserId, tenancyId), "1");
}
