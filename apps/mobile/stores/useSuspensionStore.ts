import { create } from "zustand";

interface SuspensionState {
  notice: { reason: string | null } | null;
  show: (reason: string | null) => void;
  clear: () => void;
  reset: () => void;
}

const initialState: Pick<SuspensionState, "notice"> = { notice: null };

export const useSuspensionStore = create<SuspensionState>((set) => ({
  ...initialState,
  show: (reason) => set({ notice: { reason } }),
  clear: () => set({ notice: null }),
  reset: () => set(initialState),
}));
