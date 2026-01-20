import { View, Text, TouchableOpacity } from 'react-native'
import { useState } from 'react';

import {
  IconMapPinFilled,
  IconChevronDown,
  IconChevronUp,
  IconLayoutGrid
} from "@tabler/icons-react-native";

import ScreenWrapper from '../../../components/layout/ScreenWrapper'
import DropdownButton from '../../../components/buttons/DropdownButton';
import SearchField from '../../../components/inputs/SearchField';

import { COLORS } from '../../../constants/colors';

export default function Search() {
  // List of City Location
  const cities = [
    'Caloocan',
    'Malabon',
    'Navotas',
    'Valenzuela',
  ];

  const [selectedCity, setSelectedCity] = useState<string>(cities[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  return (
    <ScreenWrapper scrollable hasInput className='p-5'>
      <View className='flex-row items-center justify-between mb-6'>
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

        <TouchableOpacity
          activeOpacity={0.7}
        >
          <IconLayoutGrid
            size={26}
            color={COLORS.grey}
          />
        </TouchableOpacity>
      </View>

      <SearchField />

    </ScreenWrapper>
  )
}
