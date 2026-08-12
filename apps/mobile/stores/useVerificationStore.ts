import { create } from 'zustand';
import type * as ImagePicker from 'expo-image-picker';
import type * as DocumentPicker from 'expo-document-picker';

export type DocumentFormat = 'physical' | 'digital';

export type IdCaptureResult =
  | { kind: 'camera'; asset: { uri: string; width: number; height: number } }
  | { kind: 'image'; asset: ImagePicker.ImagePickerAsset }
  | { kind: 'file'; asset: DocumentPicker.DocumentPickerAsset };

export type VerificationData = {
  selectedId: string | null;
  documentFormat: DocumentFormat | null;
  frontResult: IdCaptureResult | null;
  backResult: IdCaptureResult | null;
};

export type VerificationStore = VerificationData & {
  setSelectedId: (id: string | null) => void;
  setDocumentFormat: (format: DocumentFormat) => void;
  setFrontResult: (result: IdCaptureResult | null) => void;
  setBackResult: (result: IdCaptureResult | null) => void;
  reset: () => void;
};

export const initialVerificationState: VerificationData = {
  selectedId: null,
  documentFormat: null,
  frontResult: null,
  backResult: null,
};

export const useVerificationStore = create<VerificationStore>((set) => ({
  ...initialVerificationState,
  setSelectedId: (selectedId) => set({ selectedId }),
  setDocumentFormat: (documentFormat) => set({ documentFormat }),
  setFrontResult: (frontResult) => set({ frontResult }),
  setBackResult: (backResult) => set({ backResult }),
  reset: () => set({ ...initialVerificationState }),
}));
