import { View, Text } from 'react-native'
import type { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import ApplicationHeader from '@/components/layout/ApplicationHeader'
import DropdownField from 'components/inputs/DropdownField'
import DateField from '@/components/inputs/DateField'

import {
  TextField,
  Input,
  Label,
  FieldError,
  Button,
  Separator,
  Dialog,
} from 'heroui-native';

import { useProfile } from '@/hooks/useProfile'
import { usePHMobileValidation } from '@repo/hooks'

import { useApplicationFormStore } from '@/stores/useApplicationFormStore'

const EMPLOYMENT_TYPES = [
  "Full-Time",
  "Part-Time",
  "Self-Employed",
  "Unemployed",
  "Student",
]

const NO_INCOME_EMPLOYMENT_TYPES = ["Unemployed", "Student"]

type FieldErrors = {
  fullName?: string
  contactNumber?: string
  dateOfBirth?: string
  currentAddress?: string
  employmentType?: string
  occupation?: string
  monthlyIncome?: string
  previousLandlordContact?: string
}

export default function FirstProcess() {
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();
  const { profile } = useProfile();

  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const scrollRef = useRef<KeyboardAwareScrollView>(null);
  const contentRef = useRef<View>(null);
  const fieldPositions = useRef<Partial<Record<keyof FieldErrors, number>>>({});

  const registerFieldRef = (field: keyof FieldErrors) => (node: View | null) => {
    if (!node || !contentRef.current) return;
    node.measureLayout(
      contentRef.current,
      (_x: number, y: number) => {
        fieldPositions.current[field] = y;
      },
      () => {},
    );
  };

  const clearFieldError = (field: keyof FieldErrors) => {
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const contactNumberValidation = usePHMobileValidation();
  const previousLandlordContactValidation = usePHMobileValidation();

  const {
    tenantInformation,
    updateTenantInformation,
    setApartmentId,
    resetApplicationForm,
  } = useApplicationFormStore();

  // Derived flag — drives company name disable + income validation
  const isNoIncomeType = NO_INCOME_EMPLOYMENT_TYPES.includes(tenantInformation.employmentType)

  useEffect(() => {
    if (apartmentId) setApartmentId(apartmentId)
  }, [apartmentId, setApartmentId])

  useEffect(() => {
    if (!profile) return

    const fullName = [profile.first_name, profile.middle_name, profile.last_name]
      .filter(Boolean)
      .join(' ')

    const address = [profile.street_address, profile.barangay, profile.city, profile.province]
      .filter(Boolean)
      .join(', ')

    if (fullName) updateTenantInformation('fullName', fullName)
    if (profile.mobile_number) updateTenantInformation('contactNumber', profile.mobile_number)
    if (profile.email) updateTenantInformation('email', profile.email)
    if (profile.birth_date) updateTenantInformation('dateOfBirth', profile.birth_date)
    if (address) updateTenantInformation('currentAddress', address)
  }, [profile, updateTenantInformation])

  const validate = (): boolean => {
    const nextErrors: FieldErrors = {}

    if (!tenantInformation.fullName.trim()) {
      nextErrors.fullName = 'Full name is required.'
    }

    const contactResult = contactNumberValidation.validate(tenantInformation.contactNumber)
    if (!contactResult.isValid) {
      nextErrors.contactNumber = contactResult.errorMessage ?? 'Invalid contact number.'
    }

    if (!tenantInformation.dateOfBirth.trim()) {
      nextErrors.dateOfBirth = 'Date of birth is required.'
    }

    if (!tenantInformation.currentAddress.trim()) {
      nextErrors.currentAddress = 'Current address is required.'
    }

    if (!tenantInformation.employmentType.trim()) {
      nextErrors.employmentType = 'Employment type is required.'
    }

    if (!tenantInformation.occupation.trim()) {
      nextErrors.occupation = 'Occupation is required.'
    }

    // Monthly income: must always be present and non-negative.
    // 0 is only valid for Unemployed / Student; all other types require > 0.
    if (
      tenantInformation.monthlyIncome === null ||
      tenantInformation.monthlyIncome === undefined ||
      Number.isNaN(tenantInformation.monthlyIncome)
    ) {
      nextErrors.monthlyIncome = 'Monthly income is required.'
    } else if (tenantInformation.monthlyIncome < 0) {
      nextErrors.monthlyIncome = 'Monthly income cannot be negative.'
    } else if (!isNoIncomeType && tenantInformation.monthlyIncome === 0) {
      nextErrors.monthlyIncome = 'Monthly income is required.'
    }

    // previousLandlordContact is optional, only validate format if filled in
    if (tenantInformation.previousLandlordContact.trim()) {
      const prevContactResult = previousLandlordContactValidation.validate(
        tenantInformation.previousLandlordContact,
      )
      if (!prevContactResult.isValid) {
        nextErrors.previousLandlordContact =
          prevContactResult.errorMessage ?? 'Invalid contact number.'
      }
    }

    setErrors(nextErrors)
    const isValid = Object.keys(nextErrors).length === 0

    if (!isValid) {
      const fieldOrder: (keyof FieldErrors)[] = [
        'fullName',
        'dateOfBirth',
        'contactNumber',
        'currentAddress',
        'employmentType',
        'occupation',
        'monthlyIncome',
        'previousLandlordContact',
      ]
      const firstInvalidField = fieldOrder.find((field) => nextErrors[field])
      const y = firstInvalidField ? fieldPositions.current[firstInvalidField] : undefined
      if (y !== undefined) {
        scrollRef.current?.scrollToPosition(0, Math.max(y - 16, 0), true)
      }
    }

    return isValid
  }

  const handleNext = () => {
    if (!validate()) return
    router.push(`/apartment/${apartmentId}/apply/second-process`);
  }

  return (
    <ScreenWrapper scrollable ref={scrollRef}>
      {/* Header with Progress Bar */}
      <ApplicationHeader
        currentTitle="Tenant Information"
        nextTitle="Rental Preferences"
        step={1}
      />

      <View className="p-5" ref={contentRef}>
        {/* Personal Information */}
        <View className="flex gap-3">
          {/* Email */}
          <TextField isRequired>
            <Label>Email</Label>
            <Input
              readOnly
              placeholder="Enter your email"
              value={tenantInformation.email}
              onChangeText={(text) => updateTenantInformation("email", text)}
            />
          </TextField>

          {/* Full Name — pre-filled from profile, not editable */}
          <View ref={registerFieldRef('fullName')}>
            <TextField isRequired isInvalid={!!errors.fullName}>
              <Label>Full Name</Label>
              <Input
                readOnly
                placeholder="Enter your full name"
                value={tenantInformation.fullName}
              />
              <FieldError>{errors.fullName}</FieldError>
            </TextField>
          </View>

          {/* Date of Birth */}
          <View ref={registerFieldRef('dateOfBirth')}>
            <DateField
              label="Date of Birth"
              placeholder="No date of birth on file"
              value={tenantInformation.dateOfBirth ? new Date(tenantInformation.dateOfBirth) : null}
              required
              readOnly
              error={errors.dateOfBirth}
            />
          </View>

          {/* Contact Number */}
          <View ref={registerFieldRef('contactNumber')}>
            <TextField isRequired isInvalid={!!errors.contactNumber}>
              <Label>Contact Number</Label>
              <Input
                placeholder="Enter your contact number"
                value={tenantInformation.contactNumber}
                onChangeText={(text) => {
                  updateTenantInformation("contactNumber", text)
                  if (contactNumberValidation.validate(text).isValid) clearFieldError('contactNumber')
                }}
                onBlur={() => contactNumberValidation.validate(tenantInformation.contactNumber)}
              />
              <FieldError>{errors.contactNumber}</FieldError>
            </TextField>
          </View>

          {/* Current Address */}
          <View ref={registerFieldRef('currentAddress')}>
            <TextField isRequired isInvalid={!!errors.currentAddress}>
              <Label>Current Address</Label>
              <Input
                placeholder="Enter your current address"
                value={tenantInformation.currentAddress}
                onChangeText={(text) => {
                  updateTenantInformation("currentAddress", text)
                  if (text.trim()) clearFieldError('currentAddress')
                }}
              />
              <FieldError>{errors.currentAddress}</FieldError>
            </TextField>
          </View>
        </View>

        <Separator className="my-5" />

        {/* Employment Information */}
        <Text className="text-foreground text-lg font-interMedium mb-5">
          Employment & Income Details
        </Text>

        <View className="flex gap-3">
          {/* Employment Type */}
          <View ref={registerFieldRef('employmentType')}>
            <DropdownField
              label="Employment Type"
              bottomSheetLabel="Select Employment Type"
              placeholder="Select your employment type"
              options={EMPLOYMENT_TYPES}
              value={tenantInformation.employmentType}
              onSelect={(value) => {
                updateTenantInformation("employmentType", value ?? "")
                if (value) clearFieldError('employmentType')

                // Clear company name when switching to a type that has no employer
                if (value && NO_INCOME_EMPLOYMENT_TYPES.includes(value)) {
                  updateTenantInformation("companyName", "")
                }
              }}
              required
              error={errors.employmentType}
            />
          </View>

          {/* Occupation */}
          <View ref={registerFieldRef('occupation')}>
            <TextField isRequired isInvalid={!!errors.occupation}>
              <Label>Occupation/Job Title</Label>
              <Input
                placeholder="Enter your occupation"
                value={tenantInformation.occupation}
                onChangeText={(text) => {
                  updateTenantInformation("occupation", text)
                  if (text.trim()) clearFieldError('occupation')
                }}
              />
              <FieldError>{errors.occupation}</FieldError>
            </TextField>
          </View>

          {/* Company Name — disabled for Unemployed / Student */}
          <TextField isDisabled={isNoIncomeType}>
            <Label>Company Name</Label>
            <Input
              placeholder={
                isNoIncomeType ? 'Not applicable' : 'Enter your company name'
              }
              value={isNoIncomeType ? '' : tenantInformation.companyName}
              onChangeText={(text) =>
                updateTenantInformation("companyName", text)
              }
            />
          </TextField>

          {/* Monthly Income */}
          <View ref={registerFieldRef('monthlyIncome')}>
            <TextField isRequired isInvalid={!!errors.monthlyIncome}>
              <Label>Monthly Income</Label>
              <Input
                placeholder={isNoIncomeType ? 'Enter 0 if no income' : 'Enter your monthly income'}
                keyboardType="numeric"
                value={tenantInformation.monthlyIncome === 0 ? '' : tenantInformation.monthlyIncome.toString()}
                onChangeText={(text) => {
                  const parsed = text === '' ? 0 : parseInt(text, 10)
                  updateTenantInformation("monthlyIncome", parsed)
                  const isValid = !Number.isNaN(parsed) && parsed >= 0 && (isNoIncomeType || parsed > 0)
                  if (isValid) clearFieldError('monthlyIncome')
                }}
              />
              <FieldError>{errors.monthlyIncome}</FieldError>
            </TextField>
          </View>
        </View>

        <Separator className="my-5" />

        {/* References */}
        <Text className="text-foreground text-lg font-interMedium">
          References
        </Text>
        <Text className="text-muted font-inter mb-5">
          Preferred for Fast-Track Review
        </Text>

        <View className="flex gap-3">
          {/* Previous Landlord Name */}
          <TextField>
            <Label>Previous Landlord Name</Label>
            <Input
              placeholder="Enter your previous landlord name"
              value={tenantInformation.previousLandlordName}
              onChangeText={(text) =>
                updateTenantInformation("previousLandlordName", text)
              }
            />
          </TextField>

          {/* Previous Landlord Contact */}
          <View ref={registerFieldRef('previousLandlordContact')}>
            <TextField isInvalid={!!errors.previousLandlordContact}>
              <Label>Previous Landlord Contact</Label>
              <Input
                placeholder="Enter your previous landlord contact"
                value={tenantInformation.previousLandlordContact}
                onChangeText={(text) => {
                  updateTenantInformation("previousLandlordContact", text)
                  if (!text.trim() || previousLandlordContactValidation.validate(text).isValid) {
                    clearFieldError('previousLandlordContact')
                  }
                }}
                onBlur={() =>
                  tenantInformation.previousLandlordContact.trim() &&
                  previousLandlordContactValidation.validate(
                    tenantInformation.previousLandlordContact,
                  )
                }
              />
              <FieldError>{errors.previousLandlordContact}</FieldError>
            </TextField>
          </View>
        </View>

        {/* Cancel or Next Button */}
        <View className="flex-1 flex-row mt-16 gap-4">
          <Button
            onPress={() => setIsCancelDialogOpen(true)}
            variant="danger-soft"
            className="flex-1"
          >
            <Button.Label>Cancel</Button.Label>
          </Button>

          <Button onPress={handleNext} className="flex-1">
            <Button.Label>Next</Button.Label>
          </Button>
        </View>
      </View>

      {/* Cancel Dialog if the user wants to discard progress */}
      <Dialog isOpen={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <View className="mb-5 gap-1.5">
              <Dialog.Title>Discard Application?</Dialog.Title>
              <Dialog.Description>
                Your progress will be lost if you leave now. Are
                you sure you want to cancel?
              </Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button
                variant="danger-soft"
                size="sm"
                onPress={() => {
                  resetApplicationForm();
                  router.back();
                }}
              >
                <Button.Label>Discard</Button.Label>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onPress={() => setIsCancelDialogOpen(false)}
              >
                <Button.Label>Keep Editing</Button.Label>
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </ScreenWrapper>
  );
}