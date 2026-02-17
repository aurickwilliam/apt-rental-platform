import { View, Text } from 'react-native'
import { useState } from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import ApplicationHeader from 'components/display/ApplicationHeader'
import TextField from 'components/inputs/TextField'
import Divider from 'components/display/Divider'
import DropdownField from 'components/inputs/DropdownField'
import PillButton from 'components/buttons/PillButton'
import NumberField from 'components/inputs/NumberField'

import { COLORS } from 'constants/colors'

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
      bottomPadding={50}
      backgroundColor={COLORS.darkerWhite}
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
          <TextField
            label="Full Name"
            placeholder='Enter your full name'
            value={tenantInformation.fullName}
            onChangeText={(text) => updateTenantInformation('fullName', text)}
            required
          />
          {/* Contact Number */}
          <TextField
            label="Contact Number"
            placeholder='Enter your contact number'
            value={tenantInformation.contactNumber}
            onChangeText={(text) => updateTenantInformation('contactNumber', text)}
            required
          />
          {/* Email */}
          <TextField
            label="Email"
            placeholder='Enter your email'
            value={tenantInformation.email}
            onChangeText={(text) => updateTenantInformation('email', text)}
            required
          />
          {/* Date of Birth */}
          <TextField
            label="Date of Birth"
            placeholder='Enter your date of birth'
            value={tenantInformation.dateOfBirth}
            onChangeText={(text) => updateTenantInformation('dateOfBirth', text)}
            required
          />
          {/* Current Address */}
          <TextField
            label="Current Address"
            placeholder='Enter your current address'
            value={tenantInformation.currentAddress}
            onChangeText={(text) => updateTenantInformation('currentAddress', text)}
            required
          />
        </View>

        <Divider />

        {/* Employment Information */}
        <Text className='text-text text-xl font-interMedium mb-5'>
          Employment & Income Details
        </Text>

        <View className='flex gap-3'>
          {/* Occupation */}
          <TextField
            label="Occupation/Job Title"
            placeholder='Enter your occupation'
            value={tenantInformation.occupation}
            onChangeText={(text) => updateTenantInformation('occupation', text)}
            required
          />
          {/* Company Name */}
          <TextField
            label="Company Name"
            placeholder='Enter your company name'
            value={tenantInformation.companyName}
            onChangeText={(text) => updateTenantInformation('companyName', text)}
          />
          {/* Monthly Income */}
          <NumberField
            label="Monthly Income"
            placeholder='Enter your monthly income'
            value={tenantInformation.monthlyIncome.toString()}
            onChange={(value) => updateTenantInformation('monthlyIncome', value === '' ? 0 : parseInt(value))}
            required
          />
          {/* Employment Type */}
          <DropdownField
            label="Employment Type"
            bottomSheetLabel='Select Employment Type'
            placeholder='Select your employment type'
            options={[ 'Full-Time', 'Part-Time', 'Self-Employed', 'Unemployed', 'Student']}
            value={tenantInformation.employmentType}
            onSelect={(value) => updateTenantInformation('employmentType', value)}
            required
          />
        </View>

        <Divider />

        {/* Employment Information */}
        <Text className='text-text text-xl font-interMedium mb-5'>
          References
        </Text>

        <View className='flex gap-3'>
          {/* Previous Landlord Name */}
          <TextField
            label="Previous Landlord Name"
            placeholder='Enter your previous landlord name'
            value={tenantInformation.previousLandlordName}
            onChangeText={(text) => updateTenantInformation('previousLandlordName', text)}
          />
          {/* Previous Landlord Contact */}
          <TextField
            label="Previous Landlord Contact"
            placeholder='Enter your previous landlord contact'
            value={tenantInformation.previousLandlordContact}
            onChangeText={(text) => updateTenantInformation('previousLandlordContact', text)}
          />
        </View>

        {/* Cancel or Next Button */}
        <View className='flex-1 flex-row mt-16 gap-4'>
          <View className='flex-1'>
            <PillButton
              label={'Cancel'}
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
                router.push(`/apartment/${apartmentId}/apply/second-process`);
              }}
            />
          </View>
        </View>
      </View>
    </ScreenWrapper>
  )
}
