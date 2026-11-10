import { View } from 'react-native'
import { useEffect, useRef, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'

import ScreenWrapper, { type ScreenWrapperScrollRef } from 'components/layout/ScreenWrapper'
import ApplicationHeader from '@/components/layout/ApplicationHeader'
import DateField from '@/components/inputs/DateField'

import ParkingDetailsFields from 'components/preferences/ParkingDetailsFields'
import PetDetailsFields from 'components/preferences/PetDetailsFields'
import YesNoRadioField from 'components/preferences/YesNoRadioField'

import {
  TextField,
  Input,
  Label,
  FieldError,
  TextArea,
  Button,
  Separator,
  Description,
} from 'heroui-native';

import { OTHER_PET, getPetsError, minimumPetCount } from '@repo/constants'

import { useTranslation } from '@/hooks/i18n'

import { applicationAnswersFromSavedPreferences } from '@/service/applications/applicationFormPreferences'

import { useApplicationFormStore } from '@/stores/useApplicationFormStore'
import { useUserPreferences } from '@/hooks/preferences/useUserPreferences'

type FormErrors = {
  moveInDate?: string
  noOccupants?: string
  hasPets?: string
  petDetails?: string
  isSmoker?: string
  needParking?: string
  parkingDetails?: string
  hasDisability?: string
}

export default function SecondProcess() {
  const router = useRouter();
  const { t } = useTranslation();
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();

  const { rentalPreferences, updateRentalPreferences, patchRentalPreferences } = useApplicationFormStore();
  const maxOccupants = useApplicationFormStore((state) => state.apartmentContext.maxOccupants);

  const [errors, setErrors] = useState<FormErrors>({})

  // The preference questions (and their details) start from the saved rental
  // preferences, still editable for this application; an answer the tenant
  // already gave is never replaced.
  const { preferences } = useUserPreferences()
  const savedAnswers = applicationAnswersFromSavedPreferences(preferences)
  const answersPrefilled = useRef(false)

  useEffect(() => {
    if (!savedAnswers || answersPrefilled.current) return
    answersPrefilled.current = true
    const { rentalPreferences: current, patchRentalPreferences: patch } =
      useApplicationFormStore.getState()
    patch({
      ...(current.hasPets === undefined
        ? {
            hasPets: savedAnswers.hasPets,
            kindOfPets: savedAnswers.kindOfPets,
            noOfPets: savedAnswers.noOfPets,
            nameOfPets: savedAnswers.nameOfPets,
          }
        : {}),
      ...(current.needParking === undefined
        ? {
            needParking: savedAnswers.needParking,
            noOfParkingSpots: savedAnswers.noOfParkingSpots,
            listOfVehicles: savedAnswers.listOfVehicles,
          }
        : {}),
      ...(current.isSmoker === undefined ? { isSmoker: savedAnswers.isSmoker } : {}),
      ...(current.hasDisability === undefined ? { hasDisability: savedAnswers.hasDisability } : {}),
    })
  }, [savedAnswers])

  const petsError = rentalPreferences.hasPets
    ? getPetsError(true, rentalPreferences.kindOfPets, rentalPreferences.noOfPets)
    : null

  const scrollRef = useRef<ScreenWrapperScrollRef>(null)
  const contentRef = useRef<View>(null)
  const groupOffsets = useRef<Partial<Record<string, number>>>({})
  const fieldPositions = useRef<Partial<Record<keyof FormErrors, number>>>({})

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
      newErrors.moveInDate = t("apply.error.moveInRequired");
    else if (isPastDate(rentalPreferences.moveInDate))
      newErrors.moveInDate = t("apply.error.moveInPast");
    else if (isToday(rentalPreferences.moveInDate))
      newErrors.moveInDate = t("apply.error.moveInToday");

    if (
      rentalPreferences.noOccupants === null ||
      rentalPreferences.noOccupants <= 0
    ) {
      newErrors.noOccupants = t("apply.error.occupantsInvalid");
    }
    else if (
      maxOccupants !== null && 
      rentalPreferences.noOccupants > maxOccupants
    ) {
      newErrors.noOccupants = t("apply.error.occupantsTooMany", { count: maxOccupants })
    }

    if (rentalPreferences.hasPets === undefined)
      newErrors.hasPets = t("apply.error.hasPetsRequired");
    else if (petsError)
      newErrors.petDetails = petsError

    if (rentalPreferences.needParking === undefined)
      newErrors.needParking = t("apply.error.parkingRequired");
    else if (rentalPreferences.needParking && rentalPreferences.listOfVehicles.length === 0)
      newErrors.parkingDetails = t("apply.error.vehicleKindsRequired");

    if (rentalPreferences.isSmoker === undefined)
      newErrors.isSmoker = t("apply.error.smokerRequired");

    if (rentalPreferences.hasDisability === undefined)
      newErrors.hasDisability = t("apply.error.disabilityRequired");

    setErrors(newErrors)
    const isValid = Object.keys(newErrors).length === 0

    if (!isValid) {
      const fieldOrder: (keyof FormErrors)[] = [
        'moveInDate',
        'noOccupants',
        'hasPets',
        'petDetails',
        'needParking',
        'parkingDetails',
        'isSmoker',
        'hasDisability',
      ]

      const firstInvalidField = fieldOrder.find((field) => newErrors[field])
      const y = 
        firstInvalidField 
          ? fieldPositions.current[firstInvalidField] 
          : undefined
      if (y !== undefined) {
        scrollRef.current?.scrollTo({ x: 0, y: Math.max(y - 16, 0), animated: true })
      }
    }

    return isValid
  }

  const handleNext = () => {
    if (!validate()) return
    router.push(`/apartment/${apartmentId}/apply/review-information`)
  }

  return (
    <ScreenWrapper
      header={
      <ApplicationHeader
        currentTitle={t("apply.step.preferences")}
        step={2}
      />
      }
      scrollable ref={scrollRef}
    >

      <View className="p-5" ref={contentRef}>
        <View
          className="flex gap-3"
          onLayout={(e) => {
            groupOffsets.current.main = e.nativeEvent.layout.y
          }}
        >
          {/* Move-In Date */}
          <View
            onLayout={(e) => {
              fieldPositions.current.moveInDate =
                (groupOffsets.current.main ?? 0) + e.nativeEvent.layout.y
            }}
          >
            <DateField
              label={`${t("apply.prefs.moveInDate")}:`}
              placeholder={t("apply.prefs.moveInPlaceholder")}
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
          <View
            onLayout={(e) => {
              fieldPositions.current.noOccupants =
                (groupOffsets.current.main ?? 0) + e.nativeEvent.layout.y
            }}
          >
            <TextField isRequired isInvalid={!!errors.noOccupants}>
              <Label>{`${t("apply.prefs.occupants")}:`}</Label>
              <Input
                placeholder={t("apply.prefs.occupantsPlaceholder")}
                keyboardType="numeric"
                value={
                  rentalPreferences.noOccupants !== null
                    ? rentalPreferences.noOccupants.toString()
                    : ""
                }
                onChangeText={(text) => {
                  const parsed = text === "" ? null : parseInt(text, 10);
                
                  updateRentalPreferences("noOccupants", parsed);
                
                  if (parsed === null) return;
              
                  if (
                    parsed > 0 &&
                    (maxOccupants === null || parsed <= maxOccupants)
                  ) {
                    clearError("noOccupants");
                  }
                }}
              />
              {maxOccupants !== null && (
                <Description hideOnInvalid>
                  {t("apply.prefs.maxOccupants", { count: maxOccupants })}
                </Description>
              )}
              <FieldError>{errors.noOccupants}</FieldError>
            </TextField>
          </View>

          <Separator className="my-3" />

          {savedAnswers ? (
            <Description>
              {t("apply.prefs.prefilled")}
            </Description>
          ) : null}

          {/* Has Pets */}
          <View
            onLayout={(e) => {
              fieldPositions.current.hasPets =
                (groupOffsets.current.main ?? 0) + e.nativeEvent.layout.y
            }}
            className="flex gap-5 mb-3"
          >
            <YesNoRadioField
              label={t("apply.prefs.hasPets")}
              required
              value={rentalPreferences.hasPets}
              error={errors.hasPets}
              onChange={(value) => {
                patchRentalPreferences({
                  hasPets: value,
                  kindOfPets: value ? rentalPreferences.kindOfPets : [],
                  noOfPets: value ? rentalPreferences.noOfPets : 1,
                  nameOfPets: value ? rentalPreferences.nameOfPets : null,
                })
                clearError('hasPets')
                clearError('petDetails')
              }}
            />

            {rentalPreferences.hasPets && (
              <View
                className="flex gap-5"
                onLayout={(e) => {
                  fieldPositions.current.petDetails =
                    (fieldPositions.current.hasPets ?? 0) + e.nativeEvent.layout.y
                }}
              >
                <PetDetailsFields
                  kindOfPets={rentalPreferences.kindOfPets}
                  noOfPets={rentalPreferences.noOfPets}
                  nameOfPets={rentalPreferences.nameOfPets}
                  error={errors.petDetails ? petsError : null}
                  onCountChange={(count, kinds) => {
                    patchRentalPreferences({
                      noOfPets: count,
                      kindOfPets: kinds,
                      nameOfPets: kinds.includes(OTHER_PET) ? rentalPreferences.nameOfPets : null,
                    })
                    clearError('petDetails')
                  }}
                  onKindsChange={(kinds) => {
                    patchRentalPreferences({
                      kindOfPets: kinds,
                      // Never fewer pets than kinds: raise the count as kinds are added.
                      noOfPets: Math.max(rentalPreferences.noOfPets, minimumPetCount(kinds.length)),
                      nameOfPets: kinds.includes(OTHER_PET) ? rentalPreferences.nameOfPets : null,
                    })
                    clearError('petDetails')
                  }}
                  onNameChange={(name) => updateRentalPreferences('nameOfPets', name)}
                />
              </View>
            )}
          </View>

          {/* Need Parking */}
          <View
            onLayout={(e) => {
              fieldPositions.current.needParking =
                (groupOffsets.current.main ?? 0) + e.nativeEvent.layout.y
            }}
            className="flex gap-5 mb-3"
          >
            <YesNoRadioField
              label={t("apply.prefs.parking")}
              required
              value={rentalPreferences.needParking}
              error={errors.needParking}
              onChange={(value) => {
                patchRentalPreferences({
                  needParking: value,
                  noOfParkingSpots: value ? rentalPreferences.noOfParkingSpots : 1,
                  listOfVehicles: value ? rentalPreferences.listOfVehicles : [],
                })
                clearError('needParking')
                clearError('parkingDetails')
              }}
            />

            {rentalPreferences.needParking && (
              <View
                className="flex gap-5"
                onLayout={(e) => {
                  fieldPositions.current.parkingDetails =
                    (fieldPositions.current.needParking ?? 0) + e.nativeEvent.layout.y
                }}
              >
                <ParkingDetailsFields
                  noOfParkingSpots={rentalPreferences.noOfParkingSpots}
                  listOfVehicles={rentalPreferences.listOfVehicles}
                  error={errors.parkingDetails}
                  onChange={(spots, vehicles) => {
                    patchRentalPreferences({ noOfParkingSpots: spots, listOfVehicles: vehicles })
                    clearError('parkingDetails')
                  }}
                />
              </View>
            )}
          </View>

          {/* Is Smoker */}
          <View
            onLayout={(e) => {
              fieldPositions.current.isSmoker =
                (groupOffsets.current.main ?? 0) + e.nativeEvent.layout.y
            }}
            className="mb-3"
          >
            <YesNoRadioField
              label={t("apply.prefs.smoker")}
              required
              value={rentalPreferences.isSmoker}
              error={errors.isSmoker}
              onChange={(value) => {
                updateRentalPreferences('isSmoker', value)
                clearError('isSmoker')
              }}
            />
          </View>

          {/* Household Disability */}
          <View
            onLayout={(e) => {
              fieldPositions.current.hasDisability =
                (groupOffsets.current.main ?? 0) + e.nativeEvent.layout.y
            }}
            className="mb-3"
          >
            <YesNoRadioField
              label={t("apply.prefs.disability")}
              required
              value={rentalPreferences.hasDisability}
              error={errors.hasDisability}
              onChange={(value) => {
                updateRentalPreferences('hasDisability', value)
                clearError('hasDisability')
              }}
            />
          </View>

          <Separator className="my-3" />

          {/* Additional Notes (optional) — never errors, no ref needed */}
          <TextField>
            <Label>{`${t("apply.prefs.notes")}:`}</Label>
            <TextArea
              maxLength={1000}
              className="h-50 p-3"
              placeholder={t("apply.prefs.notesPlaceholder")}
              value={rentalPreferences.additionalNotes}
              onChangeText={(text) =>
                updateRentalPreferences("additionalNotes", text)
              }
            />
            <Description>
              {t("apply.prefs.notesCount", { count: rentalPreferences.additionalNotes.length, max: 1000 })}
            </Description>
          </TextField>
        </View>

        {/* Back / Next */}
        <View className="flex-1 flex-row mt-16 gap-4">
          <Button
            variant="tertiary"
            onPress={() => router.back()}
            className="flex-1"
          >
            <Button.Label>{t("common.back")}</Button.Label>
          </Button>

          <Button onPress={handleNext} className="flex-1">
            <Button.Label>{t("common.next")}</Button.Label>
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  );
}