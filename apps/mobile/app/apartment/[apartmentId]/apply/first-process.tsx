import { View, Text } from 'react-native'
import { useState } from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import ApplicationHeader from '@/app/landlord/manage-apartment/add-apartment/components/ApplicationHeader'
import DropdownField from 'components/inputs/DropdownField'

import {
  TextField,
  Input,
  Label,
  FieldError,
  Button,
  Separator
} from 'heroui-native';

import { useColors } from '@/hooks/useTheme';

type TenantInformation = {
  fullName: string;
  contactNumber: string;
  email: string;
  dateOfBirth: string;
  currentAddress: string;
  occupation: string;
  companyName: string;
  monthlyIncome: number;
  employmentType: string;
  previousLandlordName: string;
  previousLandlordContact: string;
}

export default function FirstProcess() {
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();

  // TODO: Fetch tenant information from API and pre-fill the form if data exists. For now, using dummy data.
  // Dummy Tenant Information
  const tenantInfo = {
    fullName: 'John Doe',
    contactNumber: '123-456-7890',
    email: 'johndoe@example.com',
    dateOfBirth: '1990-01-01',
    currentAddress: '123 Main St, Cityville',
  }

  const [tenantInformation, setTenantInformation] = useState<TenantInformation>({
    fullName: tenantInfo.fullName,
    contactNumber: tenantInfo.contactNumber,
    email: tenantInfo.email,
    dateOfBirth: tenantInfo.dateOfBirth,
    currentAddress: tenantInfo.currentAddress,

    occupation: '',
    companyName: '',
    monthlyIncome: 0,
    employmentType: '',

    previousLandlordName: '',
    previousLandlordContact: '',
  })

  // Function to update tenant information
  const updateTenantInformation = (field: keyof TenantInformation, value: string | number) => {
    setTenantInformation(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <ScreenWrapper
      scrollable
    >
      {/* Header with Progress Bar */}
      <ApplicationHeader
        currentTitle="Tenant Information"
        nextTitle="Rental Preferences"
        step={1}
      />

      <View className='p-5'>
        {/* Personal Information */}
        <View className='flex gap-3'>
          {/* Full Name */}
          <TextField isRequired>
            <Label>Full Name</Label>
            <Input
              placeholder='Enter your full name'
              value={tenantInformation.fullName}
              onChangeText={(text) => updateTenantInformation('fullName', text)}
            />
          </TextField>

          {/* Contact Number */}
          <TextField isRequired>
            <Label>Contact Number</Label>
            <Input
              placeholder='Enter your contact number'
              value={tenantInformation.contactNumber}
              onChangeText={(text) => updateTenantInformation('contactNumber', text)}
            />
          </TextField>

          {/* Email */}
          <TextField isRequired>
            <Label>Email</Label>
            <Input
              placeholder='Enter your email'
              value={tenantInformation.email}
              onChangeText={(text) => updateTenantInformation('email', text)}
            />
          </TextField>

          {/* Date of Birth */}
          <TextField isRequired>
            <Label>Date of Birth</Label>
            <Input
              placeholder='Enter your date of birth'
              value={tenantInformation.dateOfBirth}
              onChangeText={(text) => updateTenantInformation('dateOfBirth', text)}
            />
          </TextField>

          {/* Current Address */}
          <TextField isRequired>
            <Label>Current Address</Label>
            <Input
              placeholder='Enter your current address'
              value={tenantInformation.currentAddress}
              onChangeText={(text) => updateTenantInformation('currentAddress', text)}
            />
          </TextField>
        </View>

        <Separator className="my-5" />

        {/* Employment Information */}
        <Text className='text-foreground text-lg font-interMedium mb-5'>
          Employment & Income Details
        </Text>

        <View className='flex gap-3'>
          {/* Occupation */}
          <TextField isRequired>
            <Label>Occupation/Job Title</Label>
            <Input
              placeholder='Enter your occupation'
              value={tenantInformation.occupation}
              onChangeText={(text) => updateTenantInformation('occupation', text)}
            />
          </TextField>

          {/* Company Name */}
          <TextField>
            <Label>Company Name</Label>
            <Input
              placeholder='Enter your company name'
              value={tenantInformation.companyName}
              onChangeText={(text) => updateTenantInformation('companyName', text)}
            />
          </TextField>

          {/* Monthly Income */}
          <TextField isRequired>
            <Label>Monthly Income</Label>
            <Input
              placeholder='Enter your monthly income'
              keyboardType="numeric"
              value={tenantInformation.monthlyIncome.toString()}
              onChangeText={(text) => updateTenantInformation('monthlyIncome', text === '' ? 0 : parseInt(text))}
            />
          </TextField>

          {/* Employment Type */}
          <DropdownField
            label="Employment Type"
            bottomSheetLabel='Select Employment Type'
            placeholder='Select your employment type'
            options={['Full-Time', 'Part-Time', 'Self-Employed', 'Unemployed', 'Student']}
            value={tenantInformation.employmentType}
            onSelect={(value) => updateTenantInformation('employmentType', value ?? "")}
            required
          />
        </View>

        <Separator className="my-5" />

        {/* Employment Information */}
        <Text className='text-foreground text-lg font-interMedium'>
          References
        </Text>
        <Text className='text-muted font-inter mb-5'>
          Preferred for Fast-Track Review
        </Text>

        <View className='flex gap-3'>
          {/* Previous Landlord Name */}
          <TextField>
            <Label>Previous Landlord Name</Label>
            <Input
              placeholder='Enter your previous landlord name'
              value={tenantInformation.previousLandlordName}
              onChangeText={(text) => updateTenantInformation('previousLandlordName', text)}
            />
          </TextField>

          {/* Previous Landlord Contact */}
          <TextField>
            <Label>Previous Landlord Contact</Label>
            <Input
              placeholder='Enter your previous landlord contact'
              value={tenantInformation.previousLandlordContact}
              onChangeText={(text) => updateTenantInformation('previousLandlordContact', text)}
            />
          </TextField>
        </View>

        {/* Cancel or Next Button */}
        <View className='flex-1 flex-row mt-16 gap-4'>
          <Button 
            onPress={() => router.back()} 
            variant='danger-soft'
            className="flex-1"
          >
            <Button.Label>
              Cancel
            </Button.Label>
          </Button>

          <Button 
            onPress={() => {
              router.push(`/apartment/${apartmentId}/apply/second-process`);
            }}
            className="flex-1"
          >
            <Button.Label>
              Next
            </Button.Label>
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  )
}