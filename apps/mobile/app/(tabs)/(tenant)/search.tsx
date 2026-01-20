import { View, Text } from 'react-native'
import { useState } from 'react';

import {
  IconMapPinFilled,
  IconChevronDown,
  IconChevronUp
} from "@tabler/icons-react-native";

import ScreenWrapper from '../../../components/ScreenWrapper'
import DropdownButton from '../../../components/DropdownButton';

import { COLORS } from '../../../constants/colors';

export default function Search() {
  // List of City Location
  const cities = [
    'Caloocan',
    'Malabon',
    'Navotas',
    'Valenzuela',
  ];

  const [selectedCity, setSelectedCity] = useState(cities[0]);

  return (
    <ScreenWrapper scrollable hasInput className='p-5'>
      <View className='flex-row gap-2'>
        <IconMapPinFilled
          size={30}
          color={COLORS.primary}
        />

        <DropdownButton 
          bottomSheetLabel="Select Location"
          options={cities}
          value={selectedCity}
          onSelect={(value) => setSelectedCity(value)}
          textClassName='text-2xl text-text font-poppinsSemiBold leading-[34px]'
          buttonClassName='bg-transparent flex-row items-center justify-center gap-1'
          openIcon={IconChevronUp}
          closeIcon={IconChevronDown}
        />
      </View>
    </ScreenWrapper>
  )
}
