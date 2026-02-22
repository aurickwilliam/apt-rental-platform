import { View, Text, TouchableOpacity } from 'react-native'
import { useState } from 'react'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import DateTimeField from 'components/inputs/DateTimeField'
import DropdownButton from 'components/buttons/DropdownButton'
import TextBox from 'components/inputs/TextBox'
import PillButton from 'components/buttons/PillButton'

import { COLORS } from '@repo/constants'

import {
  IconCirclePlus,
  IconCircleMinus
} from '@tabler/icons-react-native';

type VisitDetails = {
  date: Date | null;
  time: string;
  dayPeriod: string;
  noVisitors: number;
  notes: string;
}

export default function RequestVisit() {

  const [visitDetails, setVisitDetails] = useState<VisitDetails>({
    date: null,
    time: '',
    dayPeriod: 'AM',
    noVisitors: 1,
    notes: '',
  });

  // Dropdown Options
  const timeOptions = [
    '01:00',
    '02:00',
    '03:00',
    '04:00',
    '05:00',
    '06:00',
    '07:00',
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
  ]

  const dayPeriodOptions = ['AM', 'PM'];

  // Handlers for incrementing/decrementing number of visitors
  const incrementVisitors = () => {
    setVisitDetails(prev => ({ ...prev, noVisitors: prev.noVisitors + 1 }));
  }

  const decrementVisitors = () => {
    // Minimum of 1 visitor allowed
    setVisitDetails(prev => ({ ...prev, noVisitors: prev.noVisitors > 1 ? prev.noVisitors - 1 : 1 }));
  }

  // Handle Submit Request Visit Form
  const handleSubmitRequestVisit = () => {
    // TODO: Logic to submit the request visit form
    console.log('Request Visit Submitted');
  }

  return (
    <ScreenWrapper
      scrollable
      header={
        <StandardHeader title='Request a Visit'/>
      }
      className='p-5'
    >
      <View className='flex-1 justify-between'>
        <View className='flex-1'>
          {/* Description */}
          <View>
            <Text className='text-text text-base font-inter'>
              Choose your preferred date and time to schedule a visit.
              The landlord will confirm your request as soon as possible.
            </Text>
          </View>

          {/* Form Input */}
          <View className='flex-1 gap-5 mt-8'>
            {/* Date */}
            <DateTimeField
              label='Preferred Visit Date:'
              value={visitDetails.date}
              onChange={(date) => setVisitDetails(prev => ({ ...prev, date }))}
              placeholder='Select date...'
              required
            />

            {/* Time */}
            <View className='flex-row items-center gap-3'>
              <Text className='text-text text-base font-interMedium'>
                Preferred Visit Time:
              </Text>

              <DropdownButton
                bottomSheetLabel={'Select Time'}
                options={timeOptions}
                onSelect={(value) => setVisitDetails(prev => ({ ...prev, time: value }))}
                value={visitDetails.time}
              />

              <DropdownButton
                bottomSheetLabel={'Select AM/PM'}
                options={dayPeriodOptions}
                onSelect={(value) => setVisitDetails(prev => ({ ...prev, dayPeriod: value }))}
                value={visitDetails.dayPeriod}
              />
            </View>

            {/* Number of Visitors */}
            <View className='flex-row items-center gap-5'>
              <Text className='text-text text-base font-interMedium'>
                Number of Visitors:
              </Text>

              <View className='flex-row items-center gap-5'>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={incrementVisitors}
                >
                  <IconCirclePlus
                    size={30}
                    color={COLORS.grey}
                  />
                </TouchableOpacity>

                <Text className='text-text text-xl font-interMedium'>
                  {visitDetails.noVisitors}
                </Text>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={decrementVisitors}
                >
                  <IconCircleMinus
                    size={30}
                    color={COLORS.grey}
                  />
                </TouchableOpacity>

              </View>
            </View>

            {/* Notes Text Box */}
            <View className='pb-24'>
              <TextBox
                label='Additional Notes (Optional):'
                placeholder='Any specific questions or requests for the landlord?'
                value={visitDetails.notes}
                onChangeText={(notes) => setVisitDetails(prev => ({ ...prev, notes }))}
              />
            </View>
          </View>
        </View>

        <PillButton
          label={'Request Visit'}
          onPress={handleSubmitRequestVisit}
        />
      </View>
    </ScreenWrapper>
  )
}
