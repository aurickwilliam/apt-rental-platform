import { create } from 'zustand';

export interface IdCaptureResult {
  uri: string;
  width: number;
  height: number;
}

export type VerificationData = {
  selectedId: string | null;
  /** Keyed by CaptureStepConfig.id (e.g. "front", "back", "identity-page"). */
  captures: Record<string, IdCaptureResult>;
};

export type VerificationStore = VerificationData & {
  setSelectedId: (id: string | null) => void;
  setCaptureResult: (stepId: string, result: IdCaptureResult) => void;
  clearCaptureResult: (stepId: string) => void;
  reset: () => void;
};

export const initialVerificationState: VerificationData = {
  selectedId: null,
  captures: {},
};

export const useVerificationStore = create<VerificationStore>((set) => ({
  ...initialVerificationState,
  setSelectedId: (selectedId) => set({ selectedId }),
  setCaptureResult: (stepId, result) =>
    set((state) => ({ captures: { ...state.captures, [stepId]: result } })),
  clearCaptureResult: (stepId) =>
    set((state) => {
      const { [stepId]: _removed, ...rest } = state.captures;
      return { captures: rest };
    }),
  reset: () => set({ ...initialVerificationState }),
}));
