import { create } from 'zustand';

export interface IdCaptureResult {
  uri: string;
  width: number;
  height: number;
}

export type VerificationData = {
  selectedId: string | null;
  /** Keyed by CaptureStepConfig.id (e.g. "front", "back", "identity-page"),
   * plus the reserved "selfie" key written by the selfie capture step. */
  captures: Record<string, IdCaptureResult>;
  /**
   * Desktop QR session claimed by the in-app scanner. When set, review
   * submits against the session instead of the standalone flow.
   */
  sessionClaim: ClaimedSession | null;
};

export interface ClaimedSession {
  token: string;
  verificationId: string;
  expiresAt: string;
}

export type VerificationStore = VerificationData & {
  setSelectedId: (id: string | null) => void;
  setCaptureResult: (stepId: string, result: IdCaptureResult) => void;
  clearCaptureResult: (stepId: string) => void;
  clearCaptureResults: (stepIds: string[]) => void;
  setSessionClaim: (claim: ClaimedSession | null) => void;
  reset: () => void;
};

export const initialVerificationState: VerificationData = {
  selectedId: null,
  captures: {},
  sessionClaim: null,
};

export const useVerificationStore = create<VerificationStore>((set) => ({
  ...initialVerificationState,
  setSelectedId: (selectedId) => set({ selectedId }),
  setSessionClaim: (sessionClaim) => set({ sessionClaim }),
  setCaptureResult: (stepId, result) =>
    set((state) => ({ captures: { ...state.captures, [stepId]: result } })),
  clearCaptureResult: (stepId) =>
    set((state) => {
      const { [stepId]: _removed, ...rest } = state.captures;
      return { captures: rest };
    }),
  clearCaptureResults: (stepIds) =>
    set((state) => {
      const captures = { ...state.captures };

      stepIds.forEach((stepId) => {
        delete captures[stepId];
      });

      return { captures };
    }),
  reset: () => set({ ...initialVerificationState }),
}));
