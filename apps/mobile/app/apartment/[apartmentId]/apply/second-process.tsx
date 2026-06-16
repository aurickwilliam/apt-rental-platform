import { View } from 'react-native'
import { useRef, useState } from 'react'
import type { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { useLocalSearchParams, useRouter } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import ApplicationHeader from '@/components/layout/ApplicationHeader'
import DateField from '@/components/inputs/DateField'
import DropdownField from 'components/inputs/DropdownField'

import {
  TextField,
  Input,
  Label,
  FieldError,
  TextArea,
  Button,
} from 'heroui-native';

import { useApplicationFormStore } from '@/stores/useApplicationFormStore'

type FormErrors = {
  moveInDate?: string
  intendedDuration?: string
  noOccupants?: string
  hasPets?: string
  isSmoker?: string
  needParking?: string
}

// Tracks explicit selection for boolean dropdowns — needed because
// hasPets/isSmoker/needParking default to `false` in the store,
// so we can't distinguish "unselected" from "user chose No".
type AnsweredFields = {
  hasPets: boolean
  isSmoker: boolean
  needParking: boolean
}

const DURATION_OPTIONS = [
  '6 months',
  '1 year',
  '2 years',
  'More than 2 years',
]

export default function SecondProcess() {
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();

  const { rentalPreferences, updateRentalPreferences } = useApplicationFormStore()

  const [errors, setErrors] = useState<FormErrors>({})
  const [answered, setAnswered] = useState<AnsweredFields>({
    hasPets: false,
    isSmoker: false,
    needParking: false,
  })

  const scrollRef = useRef<KeyboardAwareScrollView>(null)
  const contentRef = useRef<View>(null)
  const fieldPositions = useRef<Partial<Record<keyof FormErrors, number>>>({})

  const registerFieldRef = (field: keyof FormErrors) => (node: View | null) => {
    if (!node || !contentRef.current) return
    node.measureLayout(
      contentRef.current,
      (_x: number, y: number) => {
        fieldPositions.current[field] = y
      },
      () => {},
    )
  }

  const isPastDate = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const compareDate = new Date(date)
    compareDate.setHours(0, 0, 0, 0)
    return compareDate < today
  }

  const clearError = (field: keyof FormErrors) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }))

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!rentalPreferences.moveInDate)
      newErrors.moveInDate = 'Please select your preferred move-in date.'
    else if (isPastDate(rentalPreferences.moveInDate))
      newErrors.moveInDate = 'Move-in date cannot be in the past.'

    if (!rentalPreferences.intendedDuration)
      newErrors.intendedDuration = 'Please select your intended duration.'

    if (!rentalPreferences.noOccupants || rentalPreferences.noOccupants <= 0)
      newErrors.noOccupants = 'Please enter a valid number of occupants.'

    if (!answered.hasPets)
      newErrors.hasPets = 'Please indicate if you have pets.'

    if (!answered.isSmoker)
      newErrors.isSmoker = 'Please indicate if you are a smoker.'

    if (!answered.needParking)
      newErrors.needParking = 'Please indicate if you need parking.'

    setErrors(newErrors)
    const isValid = Object.keys(newErrors).length === 0

    if (!isValid) {
      const fieldOrder: (keyof FormErrors)[] = [
        'moveInDate',
        'intendedDuration',
        'noOccupants',
        'hasPets',
        'isSmoker',
        'needParking',
      ]

      const firstInvalidField = fieldOrder.find((field) => newErrors[field])
      const y = firstInvalidField ? fieldPositions.current[firstInvalidField] : undefined
      if (y !== undefined) {
        scrollRef.current?.scrollToPosition(0, Math.max(y - 16, 0), true)
      }
    }

    return isValid
  }

  const handleNext = () => {
    if (!validate()) return
    router.push(`/apartment/${apartmentId}/apply/third-process`)
  }

  return (
    <ScreenWrapper scrollable ref={scrollRef}>
      <ApplicationHeader
        currentTitle="Rental Preferences"
        nextTitle="Upload Required Documents"
        step={2}
      />

      <View className="p-5" ref={contentRef}>
        <View className="flex gap-3">
          {/* Move-In Date */}
          <View ref={registerFieldRef('moveInDate')}>
            <DateField
              label="Preferred Move-In Date:"
              placeholder="Select your preferred move-in date"
              required
              value={rentalPreferences.moveInDate}
              onChange={(value) => {
                updateRentalPreferences("moveInDate", value)
                if (value && !isPastDate(value)) clearError('moveInDate')
              }}
              error={errors.moveInDate}
            />
          </View>

          {/* Intended Duration */}
          <View ref={registerFieldRef('intendedDuration')}>
            <DropdownField
              label="Intended Duration:"
              bottomSheetLabel="Select your intended duration"
              options={DURATION_OPTIONS}
              value={rentalPreferences.intendedDuration || undefined}
              onSelect={(value) => {
                updateRentalPreferences("intendedDuration", value ?? "")
                if (value) clearError('intendedDuration')
              }}
              required
              error={errors.intendedDuration}
            />
          </View>

          {/* Number of Occupants */}
          <View ref={registerFieldRef("noOccupants")}>
            <TextField isRequired isInvalid={!!errors.noOccupants}>
              <Label>Number of Occupants:</Label>
              <Input
                placeholder="Enter the number of occupants"
                keyboardType="numeric"
                value={
                  rentalPreferences.noOccupants === 0
                    ? ""
                    : rentalPreferences.noOccupants.toString()
                }
                onChangeText={(text) => {
                  const parsed = parseInt(text) || 0;
                  updateRentalPreferences("noOccupants", parsed);
                  if (parsed > 0) clearError("noOccupants");
                }}
              />
              <FieldError>{errors.noOccupants}</FieldError>
            </TextField>
          </View>

          {/* Has Pets */}
          <View ref={registerFieldRef('hasPets')}>
            <DropdownField
              label="Do you have pets?"
              bottomSheetLabel="Select an option"
              options={["Yes", "No"]}
              value={answered.hasPets ? (rentalPreferences.hasPets ? "Yes" : "No") : undefined}
              onSelect={(value) => {
                updateRentalPreferences("hasPets", value === "Yes")
                setAnswered((prev) => ({ ...prev, hasPets: true }))
                clearError('hasPets')
              }}
              required
              error={errors.hasPets}
            />
          </View>

          {/* Is Smoker */}
          <View ref={registerFieldRef('isSmoker')}>
            <DropdownField
              label="Are you a smoker?"
              bottomSheetLabel="Select an option"
              options={["Yes", "No"]}
              value={answered.isSmoker ? (rentalPreferences.isSmoker ? "Yes" : "No") : undefined}
              onSelect={(value) => {
                updateRentalPreferences("isSmoker", value === "Yes")
                setAnswered((prev) => ({ ...prev, isSmoker: true }))
                clearError('isSmoker')
              }}
              required
              error={errors.isSmoker}
            />
          </View>

          {/* Need Parking */}
          <View ref={registerFieldRef('needParking')}>
            <DropdownField
              label="Do you need parking?"
              bottomSheetLabel="Select an option"
              options={["Yes", "No"]}
              value={answered.needParking ? (rentalPreferences.needParking ? "Yes" : "No") : undefined}
              onSelect={(value) => {
                updateRentalPreferences("needParking", value === "Yes")
                setAnswered((prev) => ({ ...prev, needParking: true }))
                clearError('needParking')
              }}
              required
              error={errors.needParking}
            />
          </View>

          {/* Additional Notes (optional) — never errors, no ref needed */}
          <TextField>
            <Label>Additional Notes</Label>
            <TextArea
              className="h-50 p-3"
              placeholder="Enter any additional information or preferences"
              value={rentalPreferences.additionalNotes}
              onChangeText={(text) =>
                updateRentalPreferences("additionalNotes", text)
              }
            />
          </TextField>
        </View>

        {/* Back / Next */}
        <View className="flex-1 flex-row mt-16 gap-4">
          <Button
            variant="tertiary"
            onPress={() => router.back()}
            className="flex-1"
          >
            <Button.Label>Back</Button.Label>
          </Button>

          <Button onPress={handleNext} className="flex-1">
            <Button.Label>Next</Button.Label>
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  );
}