import { create } from 'zustand'
import type { ImagePickerAsset } from 'expo-image-picker'
import type { DocumentPickerAsset } from 'expo-document-picker'

// ---------- Types ----------

export type TenantInformation = {
  fullName: string
  contactNumber: string
  email: string
  dateOfBirth: string
  currentAddress: string
  occupation: string
  companyName: string
  monthlyIncome: number
  employmentType: string
  previousLandlordName: string
  previousLandlordContact: string
}

export type RentalPreferences = {
  moveInDate: Date | null
  intendedDuration: string
  noOccupants: number
  hasPets: boolean
  isSmoker: boolean
  needParking: boolean
  additionalNotes: string
}

export type RequiredDocuments = {
  govId: ImagePickerAsset[]
  proofOfBilling: ImagePickerAsset[]
  proofOfIncome: DocumentPickerAsset | null
  nbiClearance: DocumentPickerAsset | null
}

export type UploadedDocumentPaths = {
  govId: string | null
  proofOfIncome: string | null
  proofOfBilling: string | null
  nbiClearance: string | null
}

const initialTenantInformation: TenantInformation = {
  fullName: '',
  contactNumber: '',
  email: '',
  dateOfBirth: '',
  currentAddress: '',
  occupation: '',
  companyName: '',
  monthlyIncome: 0,
  employmentType: '',
  previousLandlordName: '',
  previousLandlordContact: '',
}

const initialRentalPreferences: RentalPreferences = {
  moveInDate: null,
  intendedDuration: '',
  noOccupants: 0,
  hasPets: false,
  isSmoker: false,
  needParking: false,
  additionalNotes: '',
}

const initialDocuments: RequiredDocuments = {
  govId: [],
  proofOfBilling: [],
  proofOfIncome: null,
  nbiClearance: null,
}

const initialUploadedPaths: UploadedDocumentPaths = {
  govId: null,
  proofOfIncome: null,
  proofOfBilling: null,
  nbiClearance: null,
}

// ---------- Store ----------

type ApplicationFormState = {
  apartmentId: string | null

  tenantInformation: TenantInformation
  rentalPreferences: RentalPreferences
  documents: RequiredDocuments
  uploadedPaths: UploadedDocumentPaths

  isSubmitting: boolean

  // Setters
  setApartmentId: (apartmentId: string) => void
  updateTenantInformation: <K extends keyof TenantInformation>(
    field: K,
    value: TenantInformation[K],
  ) => void
  updateRentalPreferences: <K extends keyof RentalPreferences>(
    field: K,
    value: RentalPreferences[K],
  ) => void
  updateImageDocument: (field: 'govId' | 'proofOfBilling', assets: ImagePickerAsset[]) => void
  updateFileDocument: (field: 'proofOfIncome' | 'nbiClearance', asset: DocumentPickerAsset | null) => void
  setUploadedPath: (field: keyof UploadedDocumentPaths, path: string | null) => void
  setIsSubmitting: (isSubmitting: boolean) => void

  // Lifecycle
  resetApplicationForm: () => void
}

export const useApplicationFormStore = create<ApplicationFormState>((set) => ({
  apartmentId: null,

  tenantInformation: initialTenantInformation,
  rentalPreferences: initialRentalPreferences,
  documents: initialDocuments,
  uploadedPaths: initialUploadedPaths,

  isSubmitting: false,

  setApartmentId: (apartmentId) => set({ apartmentId }),

  updateTenantInformation: (field, value) =>
    set((state) => ({
      tenantInformation: {
        ...state.tenantInformation,
        [field]: value,
      },
    })),

  updateRentalPreferences: (field, value) =>
    set((state) => ({
      rentalPreferences: {
        ...state.rentalPreferences,
        [field]: value,
      },
    })),

  updateImageDocument: (field, assets) =>
    set((state) => ({
      documents: {
        ...state.documents,
        [field]: assets,
      },
    })),

  updateFileDocument: (field, asset) =>
    set((state) => ({
      documents: {
        ...state.documents,
        [field]: asset,
      },
    })),

  setUploadedPath: (field, path) =>
    set((state) => ({
      uploadedPaths: {
        ...state.uploadedPaths,
        [field]: path,
      },
    })),

  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),

  resetApplicationForm: () =>
    set({
      apartmentId: null,
      tenantInformation: initialTenantInformation,
      rentalPreferences: initialRentalPreferences,
      documents: initialDocuments,
      uploadedPaths: initialUploadedPaths,
      isSubmitting: false,
    }),
}))