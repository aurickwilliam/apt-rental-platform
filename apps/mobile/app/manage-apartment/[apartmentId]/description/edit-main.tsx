import { View, Text, Image, TouchableOpacity } from 'react-native'
import { useState } from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'

import DropdownField from '@/components/inputs/DropdownField'
import NumberField from '@/components/inputs/NumberField'
import TextField from '@/components/inputs/TextField'
import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import Divider from '@/components/display/Divider'
import PillButton from '@/components/buttons/PillButton'

import { DEFAULT_IMAGES } from '@/constants/images'
import { COLORS } from '@repo/constants'

import {
  IconCameraPlus,
  IconXboxXFilled,
  IconFileText,
} from '@tabler/icons-react-native'

const apartmentTypes = [
  'Studio',
  'Bungalow',
  'Duplex',
  'Loft',
  'Maisonette',
  'Penthouse',
]

type ApartmentInformation = {
  name: string;
  address: string;
  type: typeof apartmentTypes[number];
  rent: number;
}

export default function EditMain() {
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams();

  const [apartmentInformation, setApartmentInformation] = useState<ApartmentInformation>({
    name: 'Apartment Name',
    address: '123 Main St, City, Country',
    type: 'Studio',
    rent: 1200,
  })

  // Dummy additional photos
  const additionalPhotos = [
    {
      id: 1,
      uri: Image.resolveAssetSource(DEFAULT_IMAGES.defaultThumbnail).uri,
    },
    {
      id: 2,
      uri: Image.resolveAssetSource(DEFAULT_IMAGES.defaultThumbnail2).uri,
    },
    {
      id: 3,
      uri: Image.resolveAssetSource(DEFAULT_IMAGES.defaultThumbnail3).uri,
    },
    {
      id: 4,
      uri: Image.resolveAssetSource(DEFAULT_IMAGES.defaultThumbnail4).uri,
    }
  ]

  // Handle the save changes action
  const handleSaveChanges = () => {
    // TODO: Implement here you would typically send the updated apartment information to your backend or state management
    console.log('Saved Apartment Information:', apartmentInformation);

    router.replace(`/manage-apartment/${apartmentId}/description`);
  }

  return (
    <ScreenWrapper
      className='p-5'
      header={
        <StandardHeader title='Edit Main Information' />
      }
      scrollable
    >
      {/* Input Fields */}
      <View className='flex gap-3'>
        <TextField 
          label='Apartment Name:'
          required
          placeholder='Enter apartment name'
          value={apartmentInformation.name}
          onChangeText={(value) => setApartmentInformation({...apartmentInformation, name: value})}
        />

        <TextField 
          label='Apartment Address:'
          required
          placeholder='Enter apartment address'
          value={apartmentInformation.address}
          onChangeText={(value) => setApartmentInformation({...apartmentInformation, address: value})}
        />

        <DropdownField 
          label='Apartment Type:'
          required
          placeholder='Select apartment type' 
          bottomSheetLabel={'Select Apartment Type'} 
          options={apartmentTypes}
          onSelect={(value) => setApartmentInformation({...apartmentInformation, type: value})}        
          value={apartmentInformation.type}
        />

        <NumberField 
          label='Monthly Rent:'
          required
          placeholder='Enter monthly rent'
          value={apartmentInformation.rent.toString()}
          onChange={(value) => setApartmentInformation({...apartmentInformation, rent: parseInt(value) || 0})}
        />
      </View>

      <Divider marginVertical={30} />

      {/* Thumbnail Preview */}
      <View className='flex gap-3'>
        <Text className='text-text text-base font-interMedium'>
          Thumbnail Photo:
        </Text>

        <Image 
          source={DEFAULT_IMAGES.defaultThumbnail}
          className='w-full h-52 rounded-xl'
        />

        <PillButton
          label='Add a Photo'
          size='sm'
          type='outline'
          leftIconName={IconCameraPlus}
          onPress={() => {}}
        />
      </View>

      {/* Additional Photos */}
      <View className='flex gap-3 mt-5'>
        <Text className='text-text text-base font-interMedium'>
          Additional Photos:
        </Text>

        <View className='flex-row flex-wrap gap-3'>
          {additionalPhotos.map((photo) => (
            <View
              key={photo.id}
              className='relative size-[31%] h-36 rounded-xl overflow-hidden'
            >
              <Image 
                source={{ uri: photo.uri }}
                style={{ width: '100%', height: '100%'}}
              />

              <TouchableOpacity className='absolute top-1 right-1'>
                <IconXboxXFilled 
                  size={24}
                  color={COLORS.lightLightLightGrey}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <PillButton
          label='Add More Photos'
          size='sm'
          type='outline'
          leftIconName={IconCameraPlus}
          onPress={() => {}}
        />
      </View>

      <Divider marginVertical={30}/>

      {/* Change Lease Agreement */}
      <View className='flex gap-3'>
        <Text className='text-text text-base font-interMedium'>
          Change Lease Agreement
        </Text>

        <PillButton
          label='Edit Lease Agreement'
          size='sm'
          type='outline'
          leftIconName={IconFileText}
          onPress={() => {}}
        />
      </View>

      <View className='h-36' />

      <PillButton
        label='Save Changes'
        size='md'
        onPress={handleSaveChanges}
      />
    </ScreenWrapper>
  )
}