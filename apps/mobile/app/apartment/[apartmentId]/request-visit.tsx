import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native'
import { useState } from 'react'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import DateTimeField from 'components/inputs/DateTimeField'
import DropdownButton from 'components/buttons/DropdownButton'

import { COLORS } from '../../../constants/colors'

import {
  IconCirclePlus,
  IconCircleMinus
} from '@tabler/icons-react-native';
import TextBox from 'components/inputs/TextBox'
import PillButton from 'components/buttons/PillButton'

export default function RequestVisit() {
  const { height, width } = useWindowDimensions();

  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState('12:00');
  const [dayPeriod, setDayPeriod] = useState('AM');
  const [noVisitors, setNoVisitors] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

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
    setNoVisitors(prev => prev + 1);
  }

  const decrementVisitors = () => {
    // Minimum of 1 visitor allowed
    setNoVisitors(prev => (prev > 1 ? prev - 1 : 1));
  }

  // Handle Submit Request Visit Form
  const handleSubmitRequestVisit = () => {
    // TODO: Logic to submit the request visit form
    console.log('Request Visit Submitted');
  }

  return (
    <ScreenWrapper
      scrollable
      hasInput
      header={
        <StandardHeader title='Request a Visit'/>
      }
      headerBackgroundColor={COLORS.primary}
      className='p-5'
    >
      <View
        style={{ minHeight: height - 175}}
      >
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
            value={date}
            onChange={setDate}
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
              onSelect={(value) => setTime(value)}         
              value={time}   
            />

            <DropdownButton
              bottomSheetLabel={'Select AM/PM'}
              options={dayPeriodOptions}
              onSelect={(value) => setDayPeriod(value)}
              value={dayPeriod}
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
                {noVisitors}
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
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>

        <View className='mt-20'>
          <PillButton 
            label={'Request Visit'}  
            onPress={handleSubmitRequestVisit}        
          />
        </View>
      </View>
    </ScreenWrapper>
  )
}