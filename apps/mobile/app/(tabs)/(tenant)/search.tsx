import {View, TouchableOpacity} from 'react-native'
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
import ApartmentHorizontalListCard from "../../../components/display/ApartmentHorizontalListCard";

import { COLORS } from '../../../constants/colors';

import { ApartmentCardProps } from '../../../types';

export default function Search() {
  // List of City Location
  const cities = [
    'Caloocan',
    'Malabon',
    'Navotas',
    'Valenzuela',
  ];

  // Dummy Data for apartment card
  const apartmentData: ApartmentCardProps[] = [
    {
      id: 1,
      name: 'Apartment 1',
      monthlyRent: 1000,
      location: 'Caloocan',
      noBedroom: 2,
      noBathroom: 1,
      areaSqm: 100,
    },
    {
      id: 2,
      name: 'Apartment 2',
      monthlyRent: 1200,
      location: 'Malabon',
      noBedroom: 3,
      noBathroom: 2,
      areaSqm: 120,
    },
    {
      id: 3,
      name: 'Apartment 3',
      monthlyRent: 1500,
      location: 'Navotas',
      noBedroom: 4,
      noBathroom: 3,
      areaSqm: 150,
    },
    {
      id: 4,
      name: 'Apartment 4',
      monthlyRent: 1800,
      location: 'Valenzuela',
      noBedroom: 5,
      noBathroom: 4,
      areaSqm: 180,
    },
    {
      id: 5,
      name: 'Apartment 5',
      monthlyRent: 2000,
      location: 'Caloocan',
      noBedroom: 6,
      noBathroom: 5,
      areaSqm: 200,
    },
  ];

  const [selectedCity, setSelectedCity] = useState<string>(cities[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  return (
    <ScreenWrapper
      scrollable
      hasInput
      className='py-5'
      backgroundColor={COLORS.darkerWhite}
    >
      <View className='flex-row items-center justify-between mb-6 px-5'>
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

      <View className='px-5'>
        <SearchField
          searchValue={searchQuery}
          onChangeSearch={setSearchQuery}
        />
      </View>

      {/* Rendered recommended apartments */}
      <View className='gap-5'>
        <ApartmentHorizontalListCard
          apartmentData={apartmentData}
        />

        <ApartmentHorizontalListCard
          label="Good For 2"
          apartmentData={apartmentData}
        />

        <ApartmentHorizontalListCard
          label='Family Friendly'
          apartmentData={apartmentData}
        />
      </View>

    </ScreenWrapper>
  )
}
