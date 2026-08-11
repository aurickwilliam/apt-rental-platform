import { create } from 'zustand';
import type * as ImagePicker from 'expo-image-picker';

export type VerificationData = {
  selectedId: string | null;
  frontImages: ImagePicker.ImagePickerAsset[];
  backImages: ImagePicker.ImagePickerAsset[];
};

export type VerificationStore = VerificationData & {
  setSelectedId: (id: string | null) => void;
  setFrontImages: (images: ImagePicker.ImagePickerAsset[]) => void;
  setBackImages: (images: ImagePicker.ImagePickerAsset[]) => void;
  reset: () => void;
};

export const initialVerificationState: VerificationData = {
  selectedId: null,
  frontImages: [],
  backImages: [],
};

export const useVerificationStore = create<VerificationStore>((set) => ({
  ...initialVerificationState,
  setSelectedId: (selectedId) => set({ selectedId }),
  setFrontImages: (frontImages) => set({ frontImages }),
  setBackImages: (backImages) => set({ backImages }),
  reset: () => set({ ...initialVerificationState }),
}));
