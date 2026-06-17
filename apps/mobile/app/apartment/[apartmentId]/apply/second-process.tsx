import { View } from 'react-native'
import { useRef, useState } from 'react'
import type { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { useLocalSearchParams, useRouter } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import ApplicationHeader from '@/components/layout/ApplicationHeader'
import DateField from '@/components/inputs/DateField'

import {
  TextField,
  Input,
  Label,
  FieldError,
  TextArea,
  Button,
  RadioGroup,
  Radio,
  Separator,
  Description,
} from 'heroui-native';

import { useApplicationFormStore } from '@/stores/useApplicationFormStore'

type FormErrors = {
  moveInDate?: string
  noOccupants?: string
  hasPets?: string
  isSmoker?: string
  needParking?: string
}

export default function SecondProcess() {
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();

  const { rentalPreferences, updateRentalPreferences } = useApplicationFormStore();
  const maxOccupants = useApplicationFormStore((state) => state.maxOccupants);

  const [errors, setErrors] = useState<FormErrors>({})

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

  const isToday = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const compareDate = new Date(date)
    compareDate.setHours(0, 0, 0, 0)
    return compareDate.getTime() === today.getTime()
  }

  const clearError = (field: keyof FormErrors) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }))

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!rentalPreferences.moveInDate)
      newErrors.moveInDate = 'Please select your preferred move-in date.'
    else if (isPastDate(rentalPreferences.moveInDate))
      newErrors.moveInDate = 'Move-in date cannot be in the past.'
    else if (isToday(rentalPreferences.moveInDate))
      newErrors.moveInDate = 'Move-in date cannot be today.'

    if (!rentalPreferences.noOccupants || rentalPreferences.noOccupants <= 0)
      newErrors.noOccupants = 'Please enter a valid number of occupants.'
    else if (maxOccupants !== null && rentalPreferences.noOccupants > maxOccupants)
      newErrors.noOccupants = `Please enter ${maxOccupants} or fewer occupants.`

    if (rentalPreferences.hasPets === undefined)
      newErrors.hasPets = 'Please indicate if you have pets.'

    if (rentalPreferences.isSmoker === undefined)
      newErrors.isSmoker = 'Please indicate if you are a smoker.'

    if (rentalPreferences.needParking === undefined)
      newErrors.needParking = 'Please indicate if you need parking.'

    setErrors(newErrors)
    const isValid = Object.keys(newErrors).length === 0

    if (!isValid) {
      const fieldOrder: (keyof FormErrors)[] = [
        'moveInDate',
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
          <View ref={registerFieldRef("moveInDate")}>
            <DateField
              label="Preferred Move-In Date:"
              placeholder="Select your preferred move-in date"
              required
              value={rentalPreferences.moveInDate}
              onChange={(value) => {
                updateRentalPreferences("moveInDate", value);
                if (value && !isPastDate(value) && !isToday(value)) clearError("moveInDate");
              }}
              error={errors.moveInDate}
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
              {maxOccupants !== null && (
                <Description hideOnInvalid>
                  This unit allows a maximum of {maxOccupants} occupant{maxOccupants === 1 ? '' : 's'}.
                </Description>
              )}
              <FieldError>{errors.noOccupants}</FieldError>
            </TextField>
          </View>

          <Separator className="my-3" />

          {/* Has Pets */}
          <View
            ref={registerFieldRef("hasPets")}
            className="flex flex-col gap-4 mb-3"
          >
            <Label>Do you have pets?</Label>
            <RadioGroup
              className="flex-row gap-6"
              value={
                rentalPreferences.hasPets === undefined
                  ? undefined
                  : rentalPreferences.hasPets
                    ? "yes"
                    : "no"
              }
              onValueChange={(value) => {
                updateRentalPreferences("hasPets", value === "yes");
                clearError("hasPets");
              }}
              isInvalid={!!errors.hasPets}
            >
              <RadioGroup.Item
                value="yes"
                className="flex-row items-center gap-2"
              >
                <Radio />
                <Label>Yes</Label>
              </RadioGroup.Item>
              <RadioGroup.Item
                value="no"
                className="flex-row items-center gap-2"
              >
                <Radio />
                <Label>No</Label>
              </RadioGroup.Item>
            </RadioGroup>
            <FieldError isInvalid={!!errors.hasPets}>
              {errors.hasPets}
            </FieldError>
          </View>

          {/* Is Smoker */}
          <View 
            ref={registerFieldRef("isSmoker")} 
            className="flex flex-col gap-4 mb-3"
          >
            <Label>Are you a smoker?</Label>
            <RadioGroup
              className="flex-row items-center justify-start gap-6"
              value={
                rentalPreferences.isSmoker === undefined
                  ? undefined
                  : rentalPreferences.isSmoker
                    ? "yes"
                    : "no"
              }
              onValueChange={(value) => {
                updateRentalPreferences("isSmoker", value === "yes");
                clearError("isSmoker");
              }}
              isInvalid={!!errors.isSmoker}
            >
              <RadioGroup.Item
                value="yes"
                className="flex-row items-center gap-2"
              >
                <Radio />
                <Label>Yes</Label>
              </RadioGroup.Item>
              <RadioGroup.Item
                value="no"
                className="flex-row items-center gap-2"
              >
                <Radio />
                <Label>No</Label>
              </RadioGroup.Item>
            </RadioGroup>
            <FieldError isInvalid={!!errors.isSmoker}>
              {errors.isSmoker}
            </FieldError>
          </View>

          {/* Need Parking */}
          <View
            ref={registerFieldRef("needParking")}
            className="flex flex-col gap-4 mb-3"
          >
            <Label>Do you need parking?</Label>
            <RadioGroup
              className="flex-row items-center justify-start gap-6"
              value={
                rentalPreferences.needParking === undefined
                  ? undefined
                  : rentalPreferences.needParking
                    ? "yes"
                    : "no"
              }
              onValueChange={(value) => {
                updateRentalPreferences("needParking", value === "yes");
                clearError("needParking");
              }}
              isInvalid={!!errors.needParking}
            >
              <RadioGroup.Item
                value="yes"
                className="flex-row items-center gap-2"
              >
                <Radio />
                <Label>Yes</Label>
              </RadioGroup.Item>
              <RadioGroup.Item
                value="no"
                className="flex-row items-center gap-2"
              >
                <Radio />
                <Label>No</Label>
              </RadioGroup.Item>
            </RadioGroup>

            <FieldError isInvalid={!!errors.needParking}>
              {errors.needParking}
            </FieldError>
          </View>

          <Separator className="my-3" />

          {/* Additional Notes (optional) — never errors, no ref needed */}
          <TextField>
            <Label>Additional Notes:</Label>
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