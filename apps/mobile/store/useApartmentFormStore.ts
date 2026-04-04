import { create } from 'zustand'
import { ImagePickerAsset } from 'expo-image-picker'

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
  description: string
  amenities: string[]
}

interface ApartmentFormActions {
  setName: (name: string) => void
  setThumbnail: (image: ImagePickerAsset | null) => void
  addAdditionalPhoto: (image: ImagePickerAsset) => void
  removeAdditionalPhoto: (uri: string) => void
  setField: <K extends keyof ApartmentFormData>(key: K, value: ApartmentFormData[K]) => void
  setDescription: (description: string) => void
  toggleAmenity: (amenity: string) => void
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
  description: '', 
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
  setField: (key, value) => set({ [key]: value } as Pick<ApartmentFormData, typeof key>),
  setDescription: (description) => set({ description }), 

  toggleAmenity: (amenity) =>
    set((state) => ({
      amenities: state.amenities.includes(amenity)
        ? state.amenities.filter((a) => a !== amenity)
        : [...state.amenities, amenity],
    })),

  reset: () => set(initialState),
}))