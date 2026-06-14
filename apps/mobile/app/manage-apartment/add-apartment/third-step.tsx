import { View, Text } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import ApplicationHeader from '@/app/manage-apartment/add-apartment/components/ApplicationHeader'
import UploadFileField from '@/components/inputs/UploadFileField' 

import { Input, Label, TextField, FieldError, Button, Separator } from 'heroui-native'

import { useApartmentFormStore } from '@/stores/useApartmentFormStore'

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
    <ScreenWrapper scrollable>
      <ApplicationHeader
        currentTitle='Pricing & Terms'
        nextTitle='Description & Amenities'
        step={3}
        totalSteps={5}
      />

      <View className='p-5 flex-1'>
        <View className='flex gap-3'>
          <TextField isRequired isInvalid={!!errors.monthlyRent}>
            <Label>Monthly Rent:</Label>
            <Input
              placeholder="Enter monthly rent"
              value={monthlyRent}
              keyboardType="numeric"
              onChangeText={(value) => {
                setField('monthlyRent', value)
                clearError('monthlyRent')
              }}
            />
            {errors.monthlyRent && <FieldError>{errors.monthlyRent}</FieldError>}
          </TextField>

          <TextField isInvalid={!!errors.securityDeposit}>
            <Label>Security Deposit:</Label>
            <Input
              placeholder="Enter security deposit"
              value={securityDeposit}
              keyboardType="numeric"
              onChangeText={(value) => {
                setField('securityDeposit', value)
                clearError('securityDeposit')
              }}
            />
            {errors.securityDeposit && <FieldError>{errors.securityDeposit}</FieldError>}
          </TextField>

          <TextField isInvalid={!!errors.advanceRent}>
            <Label>Advance Rent:</Label>
            <Input
              placeholder="Enter advance rent"
              value={advanceRent}
              keyboardType="numeric"
              onChangeText={(value) => {
                setField('advanceRent', value)
                clearError('advanceRent')
              }}
            />
            {errors.advanceRent && <FieldError>{errors.advanceRent}</FieldError>}
          </TextField>

          {/* Total Move-in Cost */}
          {!!monthlyRent && (
            <View className='flex gap-1 bg-surface rounded-xl border border-border  px-4 py-3'>
              {/* Monthly Rent */}
              <View className='flex-row items-center justify-between'>
                <Text className='text-base font-inter text-foreground'>
                  Monthly Rent:
                </Text>
                <Text className='text-base font-inter text-foreground'>
                  ₱ {(Number(monthlyRent) || 0).toLocaleString()}
                </Text>
              </View>

              {/* Security Deposit */}
              <View className='flex-row items-center justify-between'>
                <Text className='text-base font-inter text-foreground'>
                  Security Deposit:
                </Text>
                <Text className='text-base font-inter text-foreground'>
                  ₱ {(Number(securityDeposit) || 0).toLocaleString()}
                </Text>
              </View>

              {/* Advance Rent */}
              <View className='flex-row items-center justify-between'>
                <Text className='text-base font-inter text-foreground'>
                  Advance Rent:
                </Text>
                <Text className='text-base font-inter text-foreground'>
                  ₱ {(Number(advanceRent) || 0).toLocaleString()}
                </Text>
              </View>

              <Separator className='my-4' />

              {/* Total Move-in Cost */}
              <View className='flex-row items-center justify-between'>
                <Text className='text-base font-interMedium text-foreground'>
                  Total Move-in Cost:
                </Text>
                <Text className='text-base font-interMedium text-accent'>
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

        <Separator className='my-4' />

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
          <Button
            variant="outline"
            onPress={() => router.back()}
            className="flex-1"
          >
            <Button.Label>
              Back
            </Button.Label>
          </Button>

          <Button
            onPress={handleNext}
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