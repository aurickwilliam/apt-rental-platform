import { create } from "zustand";

interface WelcomeState {
  pendingAuthId: string | null;
  request: (authId: string) => void;
  dismiss: (authId: string) => void;
  reset: () => void;
}

const initialState = { pendingAuthId: null };

export const useWelcomeStore = create<WelcomeState>((set) => ({
  ...initialState,
  request: (authId) => set({ pendingAuthId: authId }),
  dismiss: (authId) => set((state) => state.pendingAuthId === authId ? initialState : state),
  reset: () => set(initialState),
}));
