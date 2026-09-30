import { create } from "zustand";

import { resolvePortal, selectPortal, type Portal } from "@/service/auth/portalPreference";

interface PortalState {
  authUserId: string | null;
  portal: Portal | null;
  loading: boolean;
  restore: (authUserId: string, roles: readonly string[], requested?: Portal | null) => Promise<Portal | null>;
  switchTo: (authUserId: string, roles: readonly string[], portal: Portal) => Promise<void>;
  reset: () => void;
}

let requestId = 0;

export const usePortalStore = create<PortalState>((set) => ({
  authUserId: null,
  portal: null,
  loading: true,
  restore: async (authUserId, roles, requested) => {
    const currentRequest = ++requestId;
    set({ authUserId, loading: true, portal: null });
    try {
      const portal = await resolvePortal(authUserId, roles, requested);
      if (currentRequest === requestId) set({ authUserId, portal, loading: false });
      return currentRequest === requestId ? portal : null;
    } catch (error) {
      if (currentRequest === requestId) set({ authUserId, loading: false, portal: null });
      throw error;
    }
  },
  switchTo: async (authUserId, roles, portal) => {
    const currentRequest = ++requestId;
    await selectPortal(authUserId, portal, roles);
    if (currentRequest === requestId) set({ authUserId, portal, loading: false });
  },
  reset: () => {
    ++requestId;
    // Only in-memory state is cleared. Per-account preference survives sign-out.
    set({ authUserId: null, portal: null, loading: true });
  },
}));
