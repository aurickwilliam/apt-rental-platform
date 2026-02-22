import { View, Text, Image, ImageSourcePropType } from 'react-native'
import { useState } from 'react'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import PillButton from 'components/buttons/PillButton'
import Divider from 'components/display/Divider'
import DropdownField from 'components/inputs/DropdownField'
import TextField from 'components/inputs/TextField'
import DateTimeField from 'components/inputs/DateTimeField'
import NumberField from 'components/inputs/NumberField'

import { SAMPLE_IMAGES } from 'constants/images'
import { COLORS, PROVINCES, GENDER } from '@repo/constants'

import {
  IconCamera,
  IconUser,
  IconAddressBook,
  IconHome,
} from '@tabler/icons-react-native';

type EditProfileProps = {
  backgroundImageUri: ImageSourcePropType,
  profileImageUri: ImageSourcePropType,
  firstName: string,
  lastName: string,
  middleName: string,
  email: string,
  gender: string,
  dateOfBirth: Date,
  contactNumber: string,
  currentAddress: string,
  barangay: string,
  city: string,
  province: string,
  postalCode: string,
}

export default function EditProfile() {

  // Dummy data for now, replace with actual user data fetching and state management
  const [currentTenantInfo, setCurrentTenantInfo] = useState<EditProfileProps>({
    backgroundImageUri: SAMPLE_IMAGES.sampleBackgroundPhoto,
    profileImageUri: SAMPLE_IMAGES.sampleProfilePicture,
    firstName: 'John',
    lastName: 'Doe',
    middleName: 'Agustine',
    email: 'johndoe@gmail.com',
    gender: 'Male',
    dateOfBirth: new Date('1990-01-01'),
    contactNumber: '+1234567890',
    currentAddress: '123 Main St, Cityville',
    barangay: 'Barangay 1',
    city: 'Cityville',
    province: 'Province',
    postalCode: '12345',
  });

  // Handle tenant info update
  const handleUpdateInfo = (value: Partial<EditProfileProps>) => {
    setCurrentTenantInfo(prev => ({ ...prev, ...value }));
  }

  return (
    <ScreenWrapper
      scrollable
      bottomPadding={50}
      header={
        <StandardHeader title='Edit Profile' />
      }
      className='p-5'
    >
      {/* Profile Picture */}
      <View className='flex gap-3'>
        <View className='size-32 overflow-hidden rounded-full self-center border-2 border-grey-500'>
          <Image 
            source={currentTenantInfo.profileImageUri}
            style={{ width: '100%', height: '100%'}}
            resizeMode='cover'
          />
        </View>

        <View className='mx-20'>
          <PillButton 
            label='Change Profile Picture'
            size='sm'
            leftIconName={IconCamera}
          />
        </View>
      </View>
      
      {/* Background Picture */}
      <View className='flex gap-3 mt-5'>
        <View className='w-full h-40 overflow-hidden rounded-2xl self-center border-2 border-grey-500'>
          <Image 
            source={currentTenantInfo.backgroundImageUri}
            style={{ width: '100%', height: '100%'}}
            resizeMode='cover'
          />
        </View>

        <View className='mx-20'>
          <PillButton 
            label='Change Background Picture'
            size='sm'
            leftIconName={IconCamera}
          />
        </View>
      </View>

      <Divider />

      {/* Personal Information */}
      <View className='flex gap-3'>
        <View className='flex-row gap-2'>
          <IconUser 
            size={24} 
            color={COLORS.text}
          />

          <Text className='text-text text-lg font-poppinsMedium'>
            Personal Information
          </Text>
        </View>

        <TextField 
          label='First Name:'
          value={currentTenantInfo.firstName}
          onChangeText={(text) => handleUpdateInfo({ firstName: text })}
          required
        />

        <TextField 
          label='Last Name:'
          value={currentTenantInfo.lastName}
          onChangeText={(text) => handleUpdateInfo({ lastName: text })}
          required
        />

        <TextField 
          label='Middle Name:'
          value={currentTenantInfo.middleName}
          onChangeText={(text) => handleUpdateInfo({ middleName: text })}
        />

        <DropdownField 
          label='Gender:' 
          bottomSheetLabel={'Select Gender'} 
          options={GENDER} 
          value={currentTenantInfo.gender}
          onSelect={(value) => handleUpdateInfo({ gender: value })}        
        />

        <DateTimeField 
          label='Date of Birth:'
          value={currentTenantInfo.dateOfBirth}
          onChange={(date) => handleUpdateInfo({ dateOfBirth: date })}
        />
      </View>

      <Divider />

      {/* Contact Information */}
      <View className='flex gap-3'>
        <View className='flex-row gap-2'>
          <IconAddressBook 
            size={24} 
            color={COLORS.text}
          />
          <Text className='text-text text-lg font-poppinsMedium'>
            Contact Information
          </Text>
        </View>

        <TextField 
          label='Email Address:'
          value={currentTenantInfo.email}
          onChangeText={(text) => handleUpdateInfo({ email: text })}
          required
        />

        <NumberField 
          label='Contact Number:'
          value={currentTenantInfo.contactNumber}
          onChange={(text) => handleUpdateInfo({ contactNumber: text })}
          required
        />
      </View>

      <Divider />

      {/* Address Information */}
      <View className='flex gap-3'>
        <View className='flex-row gap-2'>
          <IconHome 
            size={24} 
            color={COLORS.text}
          />
          <Text className='text-text text-lg font-poppinsMedium'>
            Address Information
          </Text>
        </View>

        <TextField 
          label='Current Address:'
          value={currentTenantInfo.currentAddress}
          onChangeText={(text) => handleUpdateInfo({ currentAddress: text })}
          required
        />

        <TextField 
          label='Barangay:'
          value={currentTenantInfo.barangay}
          onChangeText={(text) => handleUpdateInfo({ barangay: text })}
          required
        />

        <TextField
          label='City:'
          value={currentTenantInfo.city}
          onChangeText={(text) => handleUpdateInfo({ city: text })}
          required
        />

        <DropdownField 
          label='Province:' 
          bottomSheetLabel={'Select Province'} 
          options={PROVINCES} 
          value={currentTenantInfo.province}
          onSelect={(value) => handleUpdateInfo({ province: value })}        
          searchPlaceholder='Search for Province...'
          enableSearch
        />

        <NumberField 
          label='Postal Code:'
          value={currentTenantInfo.postalCode}
          onChange={(text) => handleUpdateInfo({ postalCode: text })}
          required
        />
      </View>

      <View className='mt-10'>
        <PillButton
          label='Save Changes'
          isFullWidth
        />
      </View>
    </ScreenWrapper>
  )
}