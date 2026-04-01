import { create } from 'zustand'
import { ImagePickerAsset } from 'expo-image-picker'

// Extend each step's slice as you build them out
export interface ApartmentFormData {
  // Step 1 — Photos & Title
  name: string
  thumbnail: ImagePickerAsset | null
  additionalPhotos: ImagePickerAsset[]

  // Step 2 — Basic Info (fill in as you build step 2)
  description: string
  address: string
  city: string
  barangay: string
  monthlyRent: string
  securityDeposit: string

  // Step 3 — Property Details
  bedrooms: string
  bathrooms: string
  floorArea: string
  furnished: boolean

  // Step 4 — Amenities & Perks
  amenities: string[]

  // Step 5 — Review (no extra fields needed)
}

interface ApartmentFormActions {
  // Step 1
  setName: (name: string) => void
  setThumbnail: (image: ImagePickerAsset | null) => void
  addAdditionalPhoto: (image: ImagePickerAsset) => void
  removeAdditionalPhoto: (uri: string) => void

  // Step 2
  setField: <K extends keyof ApartmentFormData>(key: K, value: ApartmentFormData[K]) => void

  // Step 4
  toggleAmenity: (amenity: string) => void

  // Utility
  reset: () => void
}

const initialState: ApartmentFormData = {
  name: '',
  thumbnail: null,
  additionalPhotos: [],
  description: '',
  address: '',
  city: '',
  barangay: '',
  monthlyRent: '',
  securityDeposit: '',
  bedrooms: '',
  bathrooms: '',
  floorArea: '',
  furnished: false,
  amenities: [],
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

  // Generic setter for simple string/bool/etc fields (handy for steps 2–3)
  setField: (key, value) => set({ [key]: value } as Pick<ApartmentFormData, typeof key>),

  toggleAmenity: (amenity) =>
    set((state) => ({
      amenities: state.amenities.includes(amenity)
        ? state.amenities.filter((a) => a !== amenity)
        : [...state.amenities, amenity],
    })),

  reset: () => set(initialState),
}))