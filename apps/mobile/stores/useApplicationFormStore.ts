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
  monthlyIncome: number | null
  employmentType: string
  previousLandlordName: string
  previousLandlordContact: string
}

export type RentalPreferences = {
  moveInDate: Date | null
  noOccupants: number | null
  hasPets: boolean | undefined
  isSmoker: boolean | undefined
  needParking: boolean | undefined
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
  monthlyIncome: null,
  employmentType: '',
  previousLandlordName: '',
  previousLandlordContact: '',
}

const initialRentalPreferences: RentalPreferences = {
  moveInDate: null,
  noOccupants: null,
  hasPets: undefined,
  isSmoker: undefined,
  needParking: undefined,
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

export type ApartmentContext = {
  maxOccupants: number | null
  name: string | null
  address: string | null
  landlordName: string | null
  type: string | null
  furnishedType: string | null
  floorLevel: string | null
  monthlyRent: number | null
  leaseDuration: string | null
  securityDeposit: number | null
  advanceRent: number | null
}

const initialApartmentContext: ApartmentContext = {
  maxOccupants: null,
  name: null,
  address: null,
  landlordName: null,
  type: null,
  furnishedType: null,
  floorLevel: null,
  monthlyRent: null,
  leaseDuration: null,
  securityDeposit: null,
  advanceRent: null,
}

// ---------- Store ----------

type ApplicationFormState = {
  apartmentContext: ApartmentContext

  tenantInformation: TenantInformation
  rentalPreferences: RentalPreferences
  documents: RequiredDocuments
  uploadedPaths: UploadedDocumentPaths

  isSubmitting: boolean

  // Setters
  setApartmentContext: <K extends keyof ApartmentContext>(
    field: K,
    value: ApartmentContext[K],
  ) => void
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
  apartmentContext: initialApartmentContext,

  tenantInformation: initialTenantInformation,
  rentalPreferences: initialRentalPreferences,
  documents: initialDocuments,
  uploadedPaths: initialUploadedPaths,

  isSubmitting: false,

  setApartmentContext: (field, value) =>
    set((state) => ({
      apartmentContext: {
        ...state.apartmentContext,
        [field]: value,
      },
    })),

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
      apartmentContext: initialApartmentContext,
      tenantInformation: initialTenantInformation,
      rentalPreferences: initialRentalPreferences,
      documents: initialDocuments,
      uploadedPaths: initialUploadedPaths,
      isSubmitting: false,
    }),
}))