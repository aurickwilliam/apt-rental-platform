import { View, Text, Image, ImageSourcePropType } from 'react-native'
import { useState } from 'react'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import DropdownField from 'components/inputs/DropdownField'
import DateField from '@/components/inputs/DateField'

import { SAMPLE_IMAGES } from 'constants/images'
import {
  PROVINCES,
  GENDERS,
  getCitiesByProvince,
  getBarangaysByCity,
  getPostalCode,
  Province
} from "@repo/constants";

import {
  Camera,
  User,
  Home,
} from 'lucide-react-native';

import { useColors } from '@/hooks/useTheme'

import {
  Button,
  TextField,
  Input,
  Separator,
  Label,
} from 'heroui-native'

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
  streetAddress: string,
  barangay: string,
  city: string,
  province: Province,
  postalCode: string,
}

export default function EditProfile() {
  const { colors } = useColors();

  // Dummy data for now, replace with actual user data fetching and state management
  const [tenantInfo, setTenantInfo] = useState<EditProfileProps>({
    backgroundImageUri: SAMPLE_IMAGES.sampleBackgroundPhoto,
    profileImageUri: SAMPLE_IMAGES.sampleProfilePicture,
    firstName: 'John',
    lastName: 'Doe',
    middleName: 'Agustine',
    email: 'johndoe@gmail.com',
    gender: 'Male',
    dateOfBirth: new Date('1990-01-01'),
    contactNumber: '+1234567890',
    streetAddress: '123 Main St, Cityville',
    barangay: 'Barangay 1',
    city: 'Cityville',
    province: PROVINCES[0],
    postalCode: '12345',
  });

  // Handle tenant info update
  const handleUpdateInfo = (value: Partial<EditProfileProps>) => {
    setTenantInfo(prev => ({ ...prev, ...value }));
  }

  // Reset dependent fields and postal code when province changes
  const handleProvinceChange = (province: Province | null) => {
    handleUpdateInfo({
      province: (province ?? '') as Province,
      city: '',
      barangay: '',
      postalCode: '',
    });
  };

  // Reset barangay and auto-fill postal code when city changes
  const handleCityChange = (city: string | null) => {
    if (!city) {
      handleUpdateInfo({ city: '', barangay: '', postalCode: '' });
      return;
    }

    // Auto-fill postal code based on selected city
    const code = getPostalCode(city);
    handleUpdateInfo({
      city,
      barangay: '',
      postalCode: code ? String(code) : '',
    });
  };

  // Derive options reactively from current state
  const cities = tenantInfo.province
    ? getCitiesByProvince(tenantInfo.province)
    : [];

  const barangays = tenantInfo.city
    ? getBarangaysByCity(tenantInfo.city)
    : [];

  return (
    <ScreenWrapper
      scrollable
      header={
        <StandardHeader title='Edit Profile' />
      }
      className='p-5'
    >
      {/* Profile Picture */}
      <View className='flex gap-3'>
        <View className='size-32 overflow-hidden rounded-full self-center border-2 border-border'>
          <Image 
            source={tenantInfo.profileImageUri}
            style={{ width: '100%', height: '100%'}}
            resizeMode='cover'
          />
        </View>

        <View className='mx-20'>
          <Button size='sm'>
            <Camera size={16} color={colors.secondaryForeground} />
            <Button.Label>
              Change Profile Picture
            </Button.Label>
          </Button>
        </View>
      </View>
      
      {/* Background Picture */}
      <View className='flex gap-3 mt-5'>
        <View className='w-full h-40 overflow-hidden rounded-2xl self-center border-2 border-border'>
          <Image 
            source={tenantInfo.backgroundImageUri}
            style={{ width: '100%', height: '100%'}}
            resizeMode='cover'
          />
        </View>

        <View className='mx-20'>
          <Button size='sm'>
            <Camera size={16} color={colors.secondaryForeground} />
            <Button.Label>
              Change Background Picture
            </Button.Label>
          </Button>
        </View>
      </View>

      <Separator className='my-5' />

      {/* Personal Information */}
      <View className='flex gap-3'>
        <View className='flex-row gap-2'>
          <User 
            size={24} 
            color={colors.textPrimary}
          />

          <Text className='text-foreground text-lg font-interSemiBold'>
            Personal Information
          </Text>
        </View>

        <TextField isRequired>
          <Label>First Name:</Label>
          <Input
            readOnly
            placeholder='Enter First Name'
            value={tenantInfo.firstName}
            onChangeText={(text) => handleUpdateInfo({ firstName: text })}
          />
        </TextField>

        <TextField isRequired>
          <Label>Last Name:</Label>
          <Input
            readOnly
            placeholder='Enter Last Name'
            value={tenantInfo.lastName}
            onChangeText={(text) => handleUpdateInfo({ lastName: text })}
          />
        </TextField>

        <TextField>
          <Label>Middle Name:</Label>
          <Input
            readOnly
            placeholder='Enter Middle Name'
            value={tenantInfo.middleName}
            onChangeText={(text) => handleUpdateInfo({ middleName: text })}
          />
        </TextField>

        <DropdownField 
          label='Gender:' 
          placeholder='Select Gender'
          bottomSheetLabel={'Select Gender'} 
          options={GENDERS} 
          value={tenantInfo.gender}
          onSelect={(value) => handleUpdateInfo({ gender: value ? value : '' })}        
        />

        <DateField 
          readOnly
          placeholder='Select Date of Birth'
          label='Date of Birth:'
          value={tenantInfo.dateOfBirth}
          onChange={(date) => handleUpdateInfo({ dateOfBirth: date })}
        />
      </View>

      <Separator className='my-5' />

      {/* Address Information */}
      <View className='flex gap-3'>
        <View className='flex-row gap-2'>
          <Home 
            size={24} 
            color={colors.textPrimary}
          />
          <Text className='text-foreground text-lg font-interSemiBold'>
            Address Information
          </Text>
        </View>

        <DropdownField 
          label='Province:' 
          placeholder='Select Province'
          bottomSheetLabel={'Select Province'} 
          options={PROVINCES} 
          value={tenantInfo.province}
          onSelect={(value) => handleProvinceChange(value as Province | null)}
          searchPlaceholder='Search for Province...'
          enableSearch
        />

        <DropdownField 
          label='City:' 
          placeholder='Select City'
          bottomSheetLabel={'Select City'} 
          options={cities}
          value={tenantInfo.city}
          onSelect={handleCityChange}
          searchPlaceholder='Search for City...'
          enableSearch
          disabled={!tenantInfo.province}
        />

        <DropdownField 
          label='Barangay:' 
          placeholder='Select Barangay'
          bottomSheetLabel={'Select Barangay'} 
          options={barangays}
          value={tenantInfo.barangay}
          onSelect={(value) => handleUpdateInfo({ barangay: value ? value : '' })}
          searchPlaceholder='Search for Barangay...'
          enableSearch
          disabled={!tenantInfo.city}
        />

        <TextField isRequired>
          <Label>Postal Code:</Label>
          <Input
            placeholder='Enter Postal Code'
            value={tenantInfo.postalCode?.toString() ?? ''}
            onChangeText={(text) => handleUpdateInfo({ postalCode: text })}
            keyboardType="numeric"
          />
        </TextField>

        <TextField isRequired>
          <Label>Street Address:</Label>
          <Input
            placeholder='Enter Street Address'
            value={tenantInfo.streetAddress}
            onChangeText={(text) => handleUpdateInfo({ streetAddress: text })}
          />
        </TextField>
      </View>

      <View className='mt-10'>
        <Button>
          <Button.Label>
            Save Changes
          </Button.Label>
        </Button>
      </View>
    </ScreenWrapper>
  )
}