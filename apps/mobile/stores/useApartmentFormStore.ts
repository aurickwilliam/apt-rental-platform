import { create } from 'zustand'
import type { DocumentPickerAsset } from 'expo-document-picker'
import { ImagePickerAsset } from 'expo-image-picker'
import { toggleAmenitySelection } from '@repo/constants'

export interface ApartmentFormData {
  // Step 1
  name: string
  thumbnail: ImagePickerAsset | null
  additionalPhotos: ImagePickerAsset[]

  // Step 2
  apartmentType: string
  streetName: string
  barangay: string
  city: string
  province: string
  postalCode: string
  mapConfirmed: boolean
  furnishingType: string
  floorArea: string
  floorLevel: string | null
  bedrooms: number
  bathrooms: number
  maxOccupants: number
  latitude: number | null
  longitude: number | null
  leaseDuration: string

  monthlyRent: string
  rentDueDay: string
  securityDepositMonths: number
  advanceRentMonths: number
  leaseAgreement: DocumentPickerAsset | null

  // Step 4
  description: string
  amenities: string[]

  /** Furthest step reached with every earlier step passed (progress bar jumps). */
  furthestStep: number
}

interface ApartmentFormActions {
  setName: (name: string) => void
  setThumbnail: (image: ImagePickerAsset | null) => void
  addAdditionalPhoto: (image: ImagePickerAsset) => void
  removeAdditionalPhoto: (uri: string) => void
  setField: <K extends keyof ApartmentFormData>(key: K, value: ApartmentFormData[K]) => void
  setDescription: (description: string) => void
  toggleAmenity: (amenity: string) => void
  reachStep: (step: number) => void
  reset: () => void
}

const initialState: ApartmentFormData = {
  name: '',
  thumbnail: null,
  additionalPhotos: [],
  apartmentType: '',
  streetName: '',
  barangay: '',
  city: '',
  // Listings are limited to CAMANAVA, Metro Manila.
  province: 'Metro Manila',
  postalCode: '',
  mapConfirmed: false,
  furnishingType: '',
  floorArea: '',
  floorLevel: null,
  bedrooms: 1,
  bathrooms: 1,
  maxOccupants: 1,
  latitude: null,
  longitude: null,
  leaseDuration: '',
  monthlyRent: '',
  rentDueDay: '5',
  securityDepositMonths: 0,
  advanceRentMonths: 0,
  leaseAgreement: null,
  description: '', 
  amenities: [],
  furthestStep: 1,
}

export const useApartmentFormStore = create<ApartmentFormData & ApartmentFormActions>((set) => ({
  ...initialState,

  setName: (name) => set({ name }),
  setThumbnail: (thumbnail) => set({ thumbnail }),
  addAdditionalPhoto: (image) =>
    set((state) => ({ additionalPhotos: [...state.additionalPhotos, image] })),
  removeAdditionalPhoto: (uri) =>
    set((state) => ({
      additionalPhotos: state.additionalPhotos.filter((p) => p.uri !== uri),
    })),
  setField: (key, value) => set({ [key]: value } as Pick<ApartmentFormData, typeof key>),
  setDescription: (description) => set({ description }), 

  toggleAmenity: (amenity) =>
    set((state) => ({
      // Picking an amenity turns off any it contradicts (e.g. No Cooking vs Kitchen).
      amenities: toggleAmenitySelection(state.amenities, amenity),
    })),

  reachStep: (step) =>
    set((state) => (step > state.furthestStep ? { furthestStep: step } : state)),

  reset: () => set(initialState),
}))
