import { View, Text, TouchableOpacity } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import ApplicationHeader from '@/components/display/ApplicationHeader'
import TextField from '@/components/inputs/TextField'
import DropdownField from '@/components/inputs/DropdownField'
import NumberField from '@/components/inputs/NumberField'
import CheckBox from '@/components/buttons/CheckBox'
import PillButton from '@/components/buttons/PillButton'

import { COLORS } from '@repo/constants'

import {
  IconCirclePlus,
  IconCircleMinus,
} from '@tabler/icons-react-native'

// Apartment types options
const apartmentTypes = [
  'Studio',
  'Bungalow',
  'Duplex',
  'Loft',
  'Penthouse',
]

export default function SecondStep() {
  const router = useRouter();

  const [selectedApartmentType, setSelectedApartmentType] = useState('');

  const [apartmentAddress, setApartmentAddress] = useState({
    streetName: '',
    barangay: '',
    city: '',
    postalCode: '',
  })
  const [isMapLocationConfirmed, setIsMapLocationConfirmed] = useState(false);
  const [selectedFurnishingType, setSelectedFurnishingType] = useState('');

  const [noBathrooms, setNoBathrooms] = useState(0);
  const [noKitchens, setNoKitchens] = useState(0);
  const [noBedrooms, setNoBedrooms] = useState(0);

  const maxValue = 10;

  // TODO: Add map API and implement pin location selection

  // Handle substracting bathrooms, kitchens, and bedrooms
  const handleSubtract = (type: 'bathrooms' | 'kitchens' | 'bedrooms') => {
    switch(type) {
      case 'bathrooms':
        setNoBathrooms(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'kitchens':
        setNoKitchens(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'bedrooms':
        setNoBedrooms(prev => prev > 0 ? prev - 1 : 0);
        break;
    }
  };

  // Handle adding bathrooms, kitchens, and bedrooms
  const handleAdd = (type: 'bathrooms' | 'kitchens' | 'bedrooms') => {
    switch(type) {
      case 'bathrooms':
        setNoBathrooms(prev => prev < maxValue ? prev + 1 : maxValue);
        break;
      case 'kitchens':
        setNoKitchens(prev => prev < maxValue ? prev + 1 : maxValue);
        break;
      case 'bedrooms':
        setNoBedrooms(prev => prev < maxValue ? prev + 1 : maxValue);
        break;
    }
  }

  return (
    <ScreenWrapper
      scrollable
      backgroundColor={COLORS.darkerWhite}
    >
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
          />

          <DropdownField 
            label='Apartment Type:'
            required
            placeholder='Select apartment type'
            options={apartmentTypes} 
            bottomSheetLabel={'Select Apartment Type'} 
            onSelect={(value) => setSelectedApartmentType(value)}       
            value={selectedApartmentType}   
          />
        </View>

        {/* Aparment Address */}
        <View className='flex gap-3 mt-10'>
          <Text className='text-text text-xl font-poppinsMedium'>
            Apartment Address
          </Text>

          <TextField 
            label='Unit No./Street Name:'
            required
            placeholder='Enter street name'
            value={apartmentAddress.streetName}
            onChangeText={(value) => setApartmentAddress({...apartmentAddress, streetName: value})}
          />

          <TextField 
            label='Barangay:'
            required
            placeholder='Enter barangay name'
            value={apartmentAddress.barangay}
            onChangeText={(value) => setApartmentAddress({...apartmentAddress, barangay: value})}
          />

          <TextField 
            label='City:'
            required
            placeholder='Enter city name'
            value={apartmentAddress.city}
            onChangeText={(value) => setApartmentAddress({...apartmentAddress, city: value})}
          />

          <NumberField 
            label='Zip Code:'
            required
            placeholder='Enter zip code'
            value={apartmentAddress.postalCode}
            onChange={(value) => setApartmentAddress({...apartmentAddress, postalCode: value})}
          />
        </View>

        {/* Apartment Location */}
        <View className='flex gap-2 mt-10'>
          <Text className='text-text text-xl font-poppinsMedium'>
            Apartment Map Location
          </Text>

          <Text className='text-text text-base font-inter'>
            Check if the pin location is correct. Drag the pin to the correct location if needed.
          </Text>

          {/* Map Button */}
          <TouchableOpacity 
            className='bg-amber-200 rounded-2xl h-52 w-full'
            onPress={() => {
              router.push('/manage-apartment/add-apartment/map-pin');
            }}
          >
            {/* Map API */}
          </TouchableOpacity>

          <CheckBox 
            label='I confirm that the pin location is correct' 
            selected={isMapLocationConfirmed}
            onPress={() => setIsMapLocationConfirmed(!isMapLocationConfirmed)}
          />
        </View>

        {/* Apartment Details */}
        <View className='flex mt-10'>
          <Text className='text-text text-xl font-poppinsMedium'>
            Apartment Details
          </Text>

          <View className='flex gap-3 mt-3'>
            <NumberField 
              label='Floor Area (sqm):'
              required
              placeholder='Enter floor area in square meters'
            />

            <DropdownField 
              label='Furnishing:'
              required
              placeholder='Select furnishing type'
              options={['Fully Furnished', 'Semi-Furnished', 'Unfurnished']}
              bottomSheetLabel={'Select Furnishing Type'} 
              onSelect={(value) => setSelectedFurnishingType(value)}       
              value={selectedFurnishingType}   
            />
          </View>

          <View className='flex-row items-center justify-between mt-10'>
            <Text className='text-text text-lg font-interMedium'>
              Bathrooms:
            </Text>

            <View className='flex-row items-center gap-7'>
              <TouchableOpacity
                onPress={() => handleAdd('bathrooms')}
              >
                <IconCirclePlus 
                  size={30} 
                  color={COLORS.text} 
                />
              </TouchableOpacity>

              <Text className='text-text text-xl font-interMedium'>
                {noBathrooms}
              </Text>

              <TouchableOpacity
                onPress={() => handleSubtract('bathrooms')}
              >
                <IconCircleMinus 
                  size={30} 
                  color={COLORS.text} 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          <View className='flex-row items-center justify-between mt-5'>
            <Text className='text-text text-lg font-interMedium'>
              Kitchens:
            </Text>

            <View className='flex-row items-center gap-7'>
              <TouchableOpacity
                onPress={() => handleAdd('kitchens')}
              >
                <IconCirclePlus 
                  size={30} 
                  color={COLORS.text} 
                />
              </TouchableOpacity>

              <Text className='text-text text-xl font-interMedium'>
                {noKitchens}
              </Text>

              <TouchableOpacity
                onPress={() => handleSubtract('kitchens')}
              >
                <IconCircleMinus 
                  size={30} 
                  color={COLORS.text} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <View className='flex-row items-center justify-between mt-5'>
            <Text className='text-text text-lg font-interMedium'>
              Bedrooms:
            </Text>

            <View className='flex-row items-center gap-7'>
              <TouchableOpacity
                onPress={() => handleAdd('bedrooms')}
              >
                <IconCirclePlus 
                  size={30} 
                  color={COLORS.text} 
                />
              </TouchableOpacity>

              <Text className='text-text text-xl font-interMedium'>
                {noBedrooms}
              </Text>

              <TouchableOpacity
                onPress={() => handleSubtract('bedrooms')}
              >
                <IconCircleMinus 
                  size={30} 
                  color={COLORS.text} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Back or Next Button */}
        <View className='flex-row mt-16 gap-4'>
          <View className='flex-1'>
            <PillButton
              label={'Back'}
              type='outline'
              isFullWidth
              onPress={() => router.back()}
            />
          </View>
          <View className='flex-1'>
            <PillButton
              label={'Next'}
              isFullWidth
              onPress={() => {
                router.push('/manage-apartment/add-apartment/third-step');
              }}
            />
          </View>
        </View>
      </View>
    </ScreenWrapper>
  )
}