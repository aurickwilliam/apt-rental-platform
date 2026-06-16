import { View } from 'react-native'
import { useState } from 'react'
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

import { useColors } from '@/hooks/useTheme';

import { useApplicationFormStore } from '@/stores/useApplicationFormStore'

export default function SecondProcess() {
  const { colors } = useColors();
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();

  const { rentalPreferences, updateRentalPreferences } = useApplicationFormStore()

  // Duration options for dropdown
  const DURATION_OPTIONS = [
    '6 months',
    '1 year',
    '2 years',
    'More than 2 years',
  ]

  return (
    <ScreenWrapper scrollable>
      <ApplicationHeader
        currentTitle="Rental Preferences"
        nextTitle="Upload Required Documents"
        step={2}
      />

      <View className="p-5">
        <View className="flex gap-3">
          {/* Move-In Date */}
          <DateField
            label="Preferred Move-In Date:"
            placeholder="Select your preferred move-in date"
            required
            value={rentalPreferences.moveInDate}
            onChange={(value) => updateRentalPreferences("moveInDate", value)}
          />

          {/* Intended Duration */}
          <DropdownField
            label="Intended Duration:"
            bottomSheetLabel="Select your intended duration"
            options={DURATION_OPTIONS}
            onSelect={(value) =>
              updateRentalPreferences("intendedDuration", value ?? "")
            }
            required
          />

          {/* Number of Occupants */}
          <TextField isRequired>
            <Label>Number of Occupants:</Label>
            <Input
              placeholder="Enter the number of occupants"
              keyboardType="numeric"
              value={rentalPreferences.noOccupants.toString()}
              onChangeText={(text) =>
                updateRentalPreferences("noOccupants", parseInt(text) || 0)
              }
            />
          </TextField>

          {/* Has Pets */}
          <DropdownField
            label="Do you have pets?"
            bottomSheetLabel="Select an option"
            options={["Yes", "No"]}
            onSelect={(value) =>
              updateRentalPreferences("hasPets", value === "Yes")
            }
            required
          />

          {/* Is Smoker */}
          <DropdownField
            label="Are you a smoker?"
            bottomSheetLabel="Select an option"
            options={["Yes", "No"]}
            onSelect={(value) =>
              updateRentalPreferences("isSmoker", value === "Yes")
            }
            required
          />

          {/* Need Parking */}
          <DropdownField
            label="Do you need parking?"
            bottomSheetLabel="Select an option"
            options={["Yes", "No"]}
            onSelect={(value) =>
              updateRentalPreferences("needParking", value === "Yes")
            }
            required
          />

          {/* Additional Notes */}
          <TextField>
            <Label>Additional Notes</Label>
            <TextArea
              placeholder="Enter any additional information or preferences"
              value={rentalPreferences.additionalNotes}
              onChangeText={(text) => updateRentalPreferences("additionalNotes", text)}
            />
          </TextField>
        </View>

        {/* Back or Next Button */}
        <View className="flex-1 flex-row mt-16 gap-4">
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
            onPress={() => {
              router.push(`/apartment/${apartmentId}/apply/third-process`);
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
  );
}
