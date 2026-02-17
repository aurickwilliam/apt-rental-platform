import { View } from 'react-native'
import { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import ApplicationHeader from 'components/display/ApplicationHeader'
import DateTimeField from 'components/inputs/DateTimeField'
import DropdownField from 'components/inputs/DropdownField'
import NumberField from 'components/inputs/NumberField'
import TextBox from 'components/inputs/TextBox'
import PillButton from 'components/buttons/PillButton'

import { COLORS } from 'constants/colors'

type RentalPreferences = {
  moveInDate: Date | null;
  intendedDuration: string;
  noOccupants: number;
  hasPets: boolean;
  isSmoker: boolean;
  needParking: boolean;
  additionalNotes: string;
}

export default function SecondProcess() {
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();

  // Duration options for dropdown
  const durationOptions = [
    '6 months',
    '1 year',
    '2 years',
    'More than 2 years',
  ]

  const [rentalPreferences, setRentalPreferences] = useState<RentalPreferences>({
    moveInDate: null,
    intendedDuration: '',
    noOccupants: 0,
    hasPets: false,
    isSmoker: false,
    needParking: false,
    additionalNotes: '',
  })

  // Function to update rental preferences
  const updateRentalPreferences = (field: keyof RentalPreferences, value: string | boolean | Date | null | number) => {
    setRentalPreferences(prev => ({
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
      <ApplicationHeader
        currentTitle="Rental Preferences"
        nextTitle="Upload Required Documents"
        step={2}
      />

      <View className='p-5'>
        <View className='flex gap-3'>
          {/* Move-In Date */}
          <DateTimeField
            label="Preferred Move-In Date"
            placeholder='Select your preferred move-in date'
            required
            value={rentalPreferences.moveInDate}
            onChange={(value) => updateRentalPreferences('moveInDate', value)}
          />

          {/* Intended Duration */}
          <DropdownField
            label="Intended Duration"
            bottomSheetLabel="Select your intended duration"
            options={durationOptions}
            onSelect={(value) => updateRentalPreferences('intendedDuration', value)}
            required
          />

          {/* Number of Occupants */}
          <NumberField
            label="Number of Occupants"
            placeholder='Enter the number of occupants'
            value={rentalPreferences.noOccupants.toString()}
            onChange={(value) => updateRentalPreferences('noOccupants', parseInt(value))}
            required
          />

          {/* Has Pets */}
          <DropdownField
            label="Do you have pets?"
            bottomSheetLabel="Select an option"
            options={['Yes', 'No']}
            onSelect={(value) => updateRentalPreferences('hasPets', value === 'Yes')}
            required
          />

          {/* Is Smoker */}
          <DropdownField
            label="Are you a smoker?"
            bottomSheetLabel="Select an option"
            options={['Yes', 'No']}
            onSelect={(value) => updateRentalPreferences('isSmoker', value === 'Yes')}
            required
          />

          {/* Need Parking */}
          <DropdownField
            label="Do you need parking?"
            bottomSheetLabel="Select an option"
            options={['Yes', 'No']}
            onSelect={(value) => updateRentalPreferences('needParking', value === 'Yes')}
            required
          />

          {/* Additional Notes */}
          <TextBox
            label="Additional Notes"
            placeholder='Enter any additional information or preferences'
            value={rentalPreferences.additionalNotes}
            onChangeText={(text) => updateRentalPreferences('additionalNotes', text)}
          />
        </View>

        {/* Back or Next Button */}
        <View className='flex-1 flex-row mt-16 gap-4'>
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
              onPress={() => {
                router.push(`/apartment/${apartmentId}/apply/third-process`);
              }}
            />
          </View>
        </View>
      </View>
    </ScreenWrapper>
  )
}
