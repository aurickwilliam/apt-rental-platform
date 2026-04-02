import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { useState } from 'react'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import ApplicationHeader from '@/components/display/ApplicationHeader'
import TextField from '@/components/inputs/TextField'
import DropdownField from '@/components/inputs/DropdownField'
import NumberField from '@/components/inputs/NumberField'
import CheckBox from '@/components/buttons/CheckBox'
import PillButton from '@/components/buttons/PillButton'

import { COLORS, APARTMENT_TYPES, PROVINCES } from '@repo/constants'

import { IconCirclePlus, IconCircleMinus } from '@tabler/icons-react-native'

import { useApartmentFormStore } from '@/store/useApartmentFormStore'

// Field-level error shape
interface FormErrors {
  apartmentType?: string
  streetName?: string
  barangay?: string
  city?: string
  province?: string
  postalCode?: string
  floorArea?: string
  furnishingType?: string
  mapConfirmed?: string
}

export default function SecondStep() {
  const router = useRouter()
  const [errors, setErrors] = useState<FormErrors>({})

  const {
    name,
    apartmentType,
    streetName,
    barangay,
    city,
    province,
    postalCode,
    mapConfirmed,
    furnishingType,
    bathrooms,
    kitchens,
    bedrooms,
    maxOccupants,
    floorArea,
    setField,
  } = useApartmentFormStore()

  const maxValue = 10
  const minValue = 1

  const handleAdd = (type: 'bathrooms' | 'kitchens' | 'bedrooms' | 'maxOccupants') => {
    if (type === 'bathrooms') setField('bathrooms', Math.min(bathrooms + 1, maxValue))
    if (type === 'kitchens') setField('kitchens', Math.min(kitchens + 1, maxValue))
    if (type === 'bedrooms') setField('bedrooms', Math.min(bedrooms + 1, maxValue))
    if (type === 'maxOccupants') setField('maxOccupants', Math.min(maxOccupants + 1, maxValue))
  }

  const handleSubtract = (type: 'bathrooms' | 'kitchens' | 'bedrooms' | 'maxOccupants') => {
    if (type === 'bathrooms') setField('bathrooms', Math.max(bathrooms - 1, minValue))
    if (type === 'kitchens') setField('kitchens', Math.max(kitchens - 1, minValue))
    if (type === 'bedrooms') setField('bedrooms', Math.max(bedrooms - 1, minValue))
    if (type === 'maxOccupants') setField('maxOccupants', Math.max(maxOccupants - 1, minValue))
  }

  // Clears a specific field error as soon as the user interacts with it
  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validateStep = (): FormErrors => {
    const errs: FormErrors = {}

    if (!apartmentType) errs.apartmentType = 'Apartment type is required'
    if (!streetName.trim()) errs.streetName = 'Street name is required'
    if (!barangay.trim()) errs.barangay = 'Barangay is required'
    if (!city.trim()) errs.city = 'City is required'
    if (!province.trim()) errs.province = 'Province is required'
    if (!postalCode.trim()) errs.postalCode = 'Zip code is required'
    if (!floorArea.trim()) errs.floorArea = 'Floor area is required'
    if (!furnishingType) errs.furnishingType = 'Furnishing type is required'
    if (!mapConfirmed) errs.mapConfirmed = 'Please confirm the pin location'

    return errs;
  }

  const handleNext = () => {
    const validationErrors = validateStep();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({});
    router.push('/manage-apartment/add-apartment/third-step');
  }

  return (
    <ScreenWrapper scrollable backgroundColor={COLORS.darkerWhite}>
      <ApplicationHeader
        currentTitle={'Basic Info'}
        nextTitle={'Pricing & Terms'}
        step={2}
        totalSteps={5}
      />

      <View className='p-5'>
        {/* Name and Type */}
        <View className='flex gap-3'>
          <TextField
            label='Apartment Name:'
            required
            placeholder='Enter apartment name'
            disabled
            value={name}
          />

          <DropdownField
            label='Apartment Type:'
            required
            placeholder='Select apartment type'
            options={APARTMENT_TYPES}
            bottomSheetLabel={'Select Apartment Type'}
            value={apartmentType}
            error={errors.apartmentType}
            onSelect={(value) => {
              setField('apartmentType', value)
              clearError('apartmentType')
            }}
          />
        </View>

        {/* Apartment Address */}
        <View className='flex gap-3 mt-10'>
          <Text className='text-text text-xl font-poppinsMedium'>Apartment Address</Text>

          <TextField
            label='Unit No./Street Name:'
            required
            placeholder='Enter street name'
            value={streetName}
            error={errors.streetName}
            onChangeText={(value) => {
              setField('streetName', value)
              clearError('streetName')
            }}
          />

          <TextField
            label='Barangay:'
            required
            placeholder='Enter barangay name'
            value={barangay}
            error={errors.barangay}
            onChangeText={(value) => {
              setField('barangay', value)
              clearError('barangay')
            }}
          />

          <TextField
            label='City:'
            required
            placeholder='Enter city name'
            value={city}
            error={errors.city}
            onChangeText={(value) => {
              setField('city', value)
              clearError('city')
            }}
          />

          <DropdownField
            label="Province:"
            bottomSheetLabel="Select your province"
            placeholder="Select your province"
            options={PROVINCES}
            value={province}
            onSelect={(value) => {
              setField('province', value)
              clearError('province')
            }}
            enableSearch
            searchPlaceholder="Search provinces..."
            required
            error={errors.province}
          />

          <NumberField
            label='Zip Code:'
            required
            placeholder='Enter zip code'
            value={postalCode}
            error={errors.postalCode}
            onChange={(value) => {
              setField('postalCode', value)
              clearError('postalCode')
            }}
          />
        </View>

        {/* Apartment Location */}
        <View className='flex gap-2 mt-10'>
          <Text className='text-text text-xl font-poppinsMedium'>Apartment Map Location</Text>

          <Text className='text-text text-base font-inter'>
            Check if the pin location is correct. Drag the pin to the correct location if needed.
          </Text>

          {/* Map Button */}
          <TouchableOpacity
            className='bg-amber-200 rounded-2xl h-52 w-full'
            onPress={() => router.push('/manage-apartment/add-apartment/map-pin')}
          >
            {/* Map API */}
          </TouchableOpacity>

          <CheckBox
            label='I confirm that the pin location is correct'
            selected={mapConfirmed}
            onPress={() => {
              setField('mapConfirmed', !mapConfirmed)
              clearError('mapConfirmed')
            }}
          />

          {errors.mapConfirmed && (
            <Text className='text-red-500 text-sm font-inter'>{errors.mapConfirmed}</Text>
          )}
        </View>

        {/* Apartment Details */}
        <View className='flex mt-10'>
          <Text className='text-text text-xl font-poppinsMedium'>Apartment Details</Text>

          <View className='flex gap-3 mt-3'>
            <NumberField
              label='Floor Area (sqm):'
              required
              placeholder='Enter floor area'
              value={floorArea}
              error={errors.floorArea}
              onChange={(value) => {
                setField('floorArea', value)
                clearError('floorArea')
              }}
            />

            <DropdownField
              label='Furnishing:'
              required
              placeholder='Select furnishing type'
              options={['Fully Furnished', 'Semi-Furnished', 'Unfurnished']}
              bottomSheetLabel={'Select Furnishing Type'}
              value={furnishingType}
              error={errors.furnishingType}
              onSelect={(value) => {
                setField('furnishingType', value)
                clearError('furnishingType')
              }}
            />
          </View>

          {/* Bathrooms */}
          <View className='flex-row items-center justify-between mt-10'>
            <Text className='text-text text-lg font-interMedium'>Bathrooms:</Text>
            <View className='flex-row items-center gap-7'>
              <TouchableOpacity 
                onPress={() => handleSubtract('bathrooms')}
                disabled={bathrooms <= minValue}
                style={{opacity: bathrooms <= minValue ? 0.3 : 1}}
              >
                <IconCircleMinus size={30} color={COLORS.text} />
              </TouchableOpacity>

              <Text className='text-text text-xl font-interMedium'>{bathrooms}</Text>

              <TouchableOpacity onPress={() => handleAdd('bathrooms')}>
                <IconCirclePlus size={30} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Kitchens */}
          <View className='flex-row items-center justify-between mt-5'>
            <Text className='text-text text-lg font-interMedium'>Kitchens:</Text>
            <View className='flex-row items-center gap-7'>
              <TouchableOpacity 
                onPress={() => handleSubtract('kitchens')}
                disabled={kitchens <= minValue}
                style={{opacity: kitchens <= minValue ? 0.3 : 1}}
              >
                <IconCircleMinus size={30} color={COLORS.text} />
              </TouchableOpacity>

              <Text className='text-text text-xl font-interMedium'>{kitchens}</Text>

              <TouchableOpacity onPress={() => handleAdd('kitchens')}>
                <IconCirclePlus size={30} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bedrooms */}
          <View className='flex-row items-center justify-between mt-5'>
            <Text className='text-text text-lg font-interMedium'>Bedrooms:</Text>
            <View className='flex-row items-center gap-7'>
              <TouchableOpacity 
                onPress={() => handleSubtract('bedrooms')}
                disabled={bedrooms <= minValue}
                style={{opacity: bedrooms <= minValue ? 0.3 : 1}}
              >
                <IconCircleMinus size={30} color={COLORS.text} />
              </TouchableOpacity>

              <Text className='text-text text-xl font-interMedium'>{bedrooms}</Text>

              <TouchableOpacity onPress={() => handleAdd('bedrooms')}>
                <IconCirclePlus size={30} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Max Occupants */}
          <View className='flex-row items-center justify-between mt-5'>
            <Text className='text-text text-lg font-interMedium'>Max Occupants:</Text>
            <View className='flex-row items-center gap-7'>
              <TouchableOpacity 
                onPress={() => handleSubtract('maxOccupants')}
                disabled={maxOccupants <= minValue}
                style={{opacity: maxOccupants <= minValue ? 0.3 : 1}}
              >
                <IconCircleMinus size={30} color={COLORS.text} />
              </TouchableOpacity>

              <Text className='text-text text-xl font-interMedium'>{maxOccupants}</Text>

              <TouchableOpacity onPress={() => handleAdd('maxOccupants')}>
                <IconCirclePlus size={30} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>

        </View>

        {/* Back or Next Button */}
        <View className='flex-row mt-16 gap-4'>
          <View className='flex-1'>
            <PillButton label={'Back'} type='outline' isFullWidth onPress={() => router.back()} />
          </View>
          <View className='flex-1'>
            <PillButton label={'Next'} isFullWidth onPress={handleNext} />
          </View>
        </View>
      </View>
    </ScreenWrapper>
  )
}