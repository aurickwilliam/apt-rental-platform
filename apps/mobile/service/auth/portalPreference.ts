import AsyncStorage from "@react-native-async-storage/async-storage";

export type Portal = "tenant" | "landlord";

const PORTAL_KEY_PREFIX = "apt-portal:";

export function isPortal(value: unknown): value is Portal {
  return value === "tenant" || value === "landlord";
}

export function authorizedPortal(roles: readonly string[], portal: unknown): Portal | null {
  return !roles.includes("admin") && isPortal(portal) && roles.includes(portal) ? portal : null;
}

export function choosePortal(
  roles: readonly string[],
  saved: unknown,
  requested?: Portal | null,
): Portal | null {
  if (roles.includes("admin")) return null;
  if (isPortal(saved) && roles.includes(saved)) return saved;
  if (requested && roles.includes(requested)) return requested;
  if (roles.includes("tenant")) return "tenant";
  if (roles.includes("landlord")) return "landlord";
  return null;
}

export function portalHome(portal: Portal) {
  return portal === "landlord"
    ? "/(tabs)/(landlord)/dashboard" as const
    : "/(tabs)/(tenant)/rentals" as const;
}

export async function resolvePortal(
  authUserId: string,
  roles: readonly string[],
  requested?: Portal | null,
): Promise<Portal | null> {
  const key = `${PORTAL_KEY_PREFIX}${authUserId}`;
  const saved = await AsyncStorage.getItem(key);
  const portal = choosePortal(roles, saved, requested);
  if (portal && saved !== portal) await AsyncStorage.setItem(key, portal);
  if (!portal && saved) await AsyncStorage.removeItem(key);
  return portal;
}

export async function selectPortal(authUserId: string, portal: Portal, roles: readonly string[]) {
  if (roles.includes("admin") || !roles.includes(portal)) throw new Error("This account does not have access to that portal.");
  await AsyncStorage.setItem(`${PORTAL_KEY_PREFIX}${authUserId}`, portal);
}
