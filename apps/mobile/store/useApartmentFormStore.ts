import { create } from 'zustand'
import { ImagePickerAsset } from 'expo-image-picker'

// Extend each step's slice as you build them out
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
  floorLevel: string
  bedrooms: number
  bathrooms: number
  kitchens: number
  maxOccupants: number
  latitude: number | null
  longitude: number | null
  leaseDuration: string

  monthlyRent: string
  securityDeposit: string
  advanceRent: string                        
  leaseAgreement: string   

  // Step 4
  amenities: string[]
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

  apartmentType: '',
  streetName: '',
  barangay: '',
  city: '',
  province: '',
  postalCode: '',
  mapConfirmed: false,
  furnishingType: '',
  floorArea: '',
  floorLevel: '',
  bedrooms: 1,
  bathrooms: 1,
  kitchens: 1,
  maxOccupants: 1,
  latitude: null,
  longitude: null,
  leaseDuration: '',

  monthlyRent: '',
  securityDeposit: '',
  advanceRent: '',
  leaseAgreement: '',

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