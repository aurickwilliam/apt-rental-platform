import { create } from 'zustand';

type RegistrationData = {
  // From CompleteProfile
  email: string;
  firstName: string;
  lastName: string;
  middleName: string;
  gender: string;
  currentAddress: string;
  barangay: string;
  city: string;
  province: string;
  postalCode: string;
  birthDate: string;
  password: string;
  userSide: string;

  // From  VerifyMobile
  mobileNumber: string;
}

type RegistrationStore = {
  data: Partial<RegistrationData>;
  setData: (fields: Partial<RegistrationData>) => void;
  reset: () => void;
}

export const useRegistrationStore = create<RegistrationStore>((set) => ({
  data: {},
  setData: (fields) => set((state) => ({ data: { ...state.data, ...fields } })),
  reset: () => set({ data: {} }),
}));