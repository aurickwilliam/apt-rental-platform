import { View } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import ApplicationHeader from '@/components/display/ApplicationHeader'
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

        <View className='flex-row mt-auto gap-4'>
          <View className='flex-1'>
            <PillButton label='Back' type='outline' isFullWidth onPress={() => router.back()} />
          </View>
          <View className='flex-1'>
            <PillButton label='Next' isFullWidth onPress={handleNext} />
          </View>
        </View>
      </View>
    </ScreenWrapper>
  )
}