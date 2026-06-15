import { View, Text, Image, ImageSourcePropType } from 'react-native'
import { useState } from 'react'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import DropdownField from 'components/inputs/DropdownField'
import DateField from '@/components/inputs/DateField'

import { SAMPLE_IMAGES } from 'constants/images'
import { PROVINCES, GENDERS } from '@repo/constants'

import {
  Camera,
  User,
  BookUser,
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
  currentAddress: string,
  barangay: string,
  city: string,
  province: string,
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
    currentAddress: '123 Main St, Cityville',
    barangay: 'Barangay 1',
    city: 'Cityville',
    province: 'Province',
    postalCode: '12345',
  });

  // Handle tenant info update
  const handleUpdateInfo = (value: Partial<EditProfileProps>) => {
    setTenantInfo(prev => ({ ...prev, ...value }));
  }

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
            value={tenantInfo.firstName}
            onChangeText={(text) => handleUpdateInfo({ firstName: text })}
          />
        </TextField>

        <TextField isRequired>
          <Label>Last Name:</Label>
          <Input
            readOnly
            value={tenantInfo.lastName}
            onChangeText={(text) => handleUpdateInfo({ lastName: text })}
          />
        </TextField>

        <TextField>
          <Label>Middle Name:</Label>
          <Input
            readOnly
            value={tenantInfo.middleName}
            onChangeText={(text) => handleUpdateInfo({ middleName: text })}
          />
        </TextField>

        <DropdownField 
          label='Gender:' 
          bottomSheetLabel={'Select Gender'} 
          options={GENDERS} 
          value={tenantInfo.gender}
          onSelect={(value) => handleUpdateInfo({ gender: value ? value : '' })}        
        />

        <DateField 
          readOnly
          label='Date of Birth:'
          value={tenantInfo.dateOfBirth}
          onChange={(date) => handleUpdateInfo({ dateOfBirth: date })}
        />
      </View>

      <Separator className='my-5' />

      {/* Contact Information */}
      <View className='flex gap-3'>
        <View className='flex-row gap-2'>
          <BookUser 
            size={24} 
            color={colors.textPrimary}
          />
          <Text className='text-foreground text-lg font-interSemiBold'>
            Contact Information
          </Text>
        </View>

        <TextField isRequired>
          <Label>Email Address:</Label>
          <Input
            value={tenantInfo.email}
            onChangeText={(text) => handleUpdateInfo({ email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </TextField>

        <TextField isRequired>
          <Label>Contact Number:</Label>
          <Input
            value={tenantInfo.contactNumber?.toString() ?? ''}
            onChangeText={(text) => handleUpdateInfo({ contactNumber: text })}
            keyboardType="phone-pad"
          />
        </TextField>
      </View>

      <Separator className='my-5' />

      {/* Address Information */}
      <View className='flex gap-3'>
        <View className='flex-row gap-2'>
          <Home 
            size={24} 
            color={colors.textPrimary}
          />
          <Text className='text-text text-lg font-interSemiBold'>
            Address Information
          </Text>
        </View>

        <TextField isRequired>
          <Label>Current Address:</Label>
          <Input
            value={tenantInfo.currentAddress}
            onChangeText={(text) => handleUpdateInfo({ currentAddress: text })}
          />
        </TextField>

        <TextField isRequired>
          <Label>Barangay:</Label>
          <Input
            value={tenantInfo.barangay}
            onChangeText={(text) => handleUpdateInfo({ barangay: text })}
          />
        </TextField>

        <TextField isRequired>
          <Label>City:</Label>
          <Input
            value={tenantInfo.city}
            onChangeText={(text) => handleUpdateInfo({ city: text })}
          />
        </TextField>

        <DropdownField 
          label='Province:' 
          bottomSheetLabel={'Select Province'} 
          options={PROVINCES} 
          value={tenantInfo.province}
          onSelect={(value) => handleUpdateInfo({ province: value ? value : '' })}        
          searchPlaceholder='Search for Province...'
          enableSearch
        />

        <TextField isRequired>
          <Label>Postal Code:</Label>
          <Input
            value={tenantInfo.postalCode?.toString() ?? ''}
            onChangeText={(text) => handleUpdateInfo({ postalCode: text })}
            keyboardType="numeric"
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