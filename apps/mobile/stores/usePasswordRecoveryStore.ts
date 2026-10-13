import { create } from "zustand";

// In-memory only: the recovery email must never go into route params or URLs.
export interface PasswordRecoveryState {
  email: string;
  setEmail: (email: string) => void;
  reset: () => void;
}

const initialState: Pick<PasswordRecoveryState, "email"> = { email: "" };

export const usePasswordRecoveryStore = create<PasswordRecoveryState>((set) => ({
  ...initialState,
  setEmail: (email) => set({ email }),
  reset: () => set(initialState),
}));
