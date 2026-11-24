import { create } from 'zustand';

import type { TutorialPortal } from '@repo/utils';

export type TutorialMode = 'auto' | 'replay';
export type TutorialStage = 'welcome' | 'steps' | 'done';

export interface TutorialState {
  /** Null while no tutorial is showing. */
  portal: TutorialPortal | null;
  mode: TutorialMode;
  stage: TutorialStage;
  stepIndex: number;
}

interface TutorialActions {
  start: (portal: TutorialPortal, mode: TutorialMode) => void;
  begin: () => void;
  next: (stepCount: number) => void;
  back: () => void;
  close: () => void;
  reset: () => void;
}

export const initialState: TutorialState = {
  portal: null,
  mode: 'auto',
  stage: 'welcome',
  stepIndex: 0,
};

export const useTutorialStore = create<TutorialState & TutorialActions>((set) => ({
  ...initialState,
  start: (portal, mode) => set({ portal, mode, stage: 'welcome', stepIndex: 0 }),
  begin: () => set({ stage: 'steps', stepIndex: 0 }),
  next: (stepCount) =>
    set((state) =>
      state.stepIndex + 1 >= stepCount
        ? { stage: 'done' }
        : { stepIndex: state.stepIndex + 1 },
    ),
  back: () => set((state) => ({ stepIndex: Math.max(0, state.stepIndex - 1) })),
  close: () => set({ ...initialState }),
  reset: () => set({ ...initialState }),
}));
