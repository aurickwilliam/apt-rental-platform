import { View, Text } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import ApplicationHeader from './components/ApplicationHeader'
import NumberField from '@/components/inputs/NumberField'
import Divider from '@/components/display/Divider'
import UploadFileField from '@/components/inputs/UploadFileField'   // ← swapped
import PillButton from '@/components/buttons/PillButton'

import { COLORS } from '@repo/constants'
import { useApartmentFormStore } from '@/store/useApartmentFormStore'

type FieldErrors = {
  monthlyRent?: string
  securityDeposit?: string
  advanceRent?: string
  leaseAgreement?: string
}

function validate(values: {
  monthlyRent: string
  securityDeposit: string
  advanceRent: string
  leaseAgreement: string 
}): FieldErrors {
  const errors: FieldErrors = {}

  if (!values.monthlyRent.trim() || Number(values.monthlyRent) <= 0)
    errors.monthlyRent = 'Monthly rent must be greater than 0.'

  if (values.securityDeposit.trim() && Number(values.securityDeposit) <= 0)
    errors.securityDeposit = 'Security deposit must be greater than 0.'

  if (values.advanceRent.trim() && Number(values.advanceRent) <= 0)
    errors.advanceRent = 'Advance rent must be greater than 0.'

  if (!values.leaseAgreement)
    errors.leaseAgreement = 'Please upload a lease agreement.'

  return errors
}

export default function ThirdStep() {
  const router = useRouter()
  const [errors, setErrors] = useState<FieldErrors>({})

  const {
    monthlyRent,
    securityDeposit,
    advanceRent,
    leaseAgreement,     
    setField,
  } = useApartmentFormStore()

  function clearError(field: keyof FieldErrors) {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function handleNext() {
    const validationErrors = validate({ monthlyRent, securityDeposit, advanceRent, leaseAgreement })
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    router.push('/manage-apartment/add-apartment/fourth-step')
  }

  return (
    <ScreenWrapper scrollable backgroundColor={COLORS.darkerWhite}>
      <ApplicationHeader
        currentTitle='Pricing & Terms'
        nextTitle='Description & Amenities'
        step={3}
        totalSteps={5}
      />

      <View className='p-5 flex-1'>
        <View className='flex gap-3'>
          <NumberField
            label='Monthly Rent:'
            placeholder='Enter monthly rent'
            required
            value={monthlyRent}
            error={errors.monthlyRent}
            onChange={(value) => {
              setField('monthlyRent', value)
              clearError('monthlyRent')
            }}
          />

          <NumberField
            label='Security Deposit:'
            placeholder='Enter security deposit'
            value={securityDeposit}
            error={errors.securityDeposit}
            onChange={(value) => {
              setField('securityDeposit', value)
              clearError('securityDeposit')
            }}
          />

          <NumberField
            label='Advance Rent:'
            placeholder='Enter advance rent'
            value={advanceRent}
            error={errors.advanceRent}
            onChange={(value) => {
              setField('advanceRent', value)
              clearError('advanceRent')
            }}
          />

          {/* Total Move-in Cost */}
          {!!monthlyRent && (
            <View className='flex gap-1 bg-white rounded-xl border border-gray-200  px-4 py-3'>
              {/* Monthly Rent */}
              <View className='flex-row items-center justify-between'>
                <Text className='text-base font-inter text-text'>
                  Monthly Rent:
                </Text>
                <Text className='text-base font-inter text-text'>
                  ₱ {(Number(monthlyRent) || 0).toLocaleString()}
                </Text>
              </View>

              {/* Security Deposit */}
              <View className='flex-row items-center justify-between'>
                <Text className='text-base font-inter text-text'>
                  Security Deposit:
                </Text>
                <Text className='text-base font-inter text-text'>
                  ₱ {(Number(securityDeposit) || 0).toLocaleString()}
                </Text>
              </View>

              {/* Advance Rent */}
              <View className='flex-row items-center justify-between'>
                <Text className='text-base font-inter text-text'>
                  Advance Rent:
                </Text>
                <Text className='text-base font-inter text-text'>
                  ₱ {(Number(advanceRent) || 0).toLocaleString()}
                </Text>
              </View>

              <Divider marginVertical={10} />

              {/* Total Move-in Cost */}
              <View className='flex-row items-center justify-between'>
                <Text className='text-base font-interMedium text-text'>
                  Total Move-in Cost:
                </Text>
                <Text className='text-base font-interMedium text-primary'>
                  ₱ {(
                    (Number(monthlyRent) || 0) +
                    (Number(securityDeposit) || 0) +
                    (Number(advanceRent) || 0)
                  ).toLocaleString()}
                </Text>
              </View>
            </View>
          )}
        </View>

        <Divider />

        <UploadFileField
          label='Lease Agreement:'
          placeholder='No lease agreement uploaded yet.'
          required
          value={leaseAgreement}
          error={errors.leaseAgreement}
          onChange={(uri) => {
            setField('leaseAgreement', uri)
            clearError('leaseAgreement')
          }}
        />

        {/* Back or Next Button */}
        <View className='flex-row mt-10 gap-4'>
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
              onPress={handleNext}
            />
          </View>
        </View>
      </View>
    </ScreenWrapper>
  )
}