import { View, TouchableOpacity } from 'react-native';

import {
  IconMapPinFilled,
  IconChevronDown,
  IconChevronUp,
  IconLayoutGrid,
  IconLayoutList,
  IconHeart,
} from '@tabler/icons-react-native';

import DropdownButton from 'components/buttons/DropdownButton';

import { COLORS } from '@repo/constants';

type SearchHeaderProps = {
  cities: string[];
  selectedCity: string;
  onSelectCity: (city: string) => void;
  isGridView: boolean;
  onToggleView: () => void;
  onFavoritesPress: () => void;
};

export default function SearchHeader({
  cities,
  selectedCity,
  onSelectCity,
  isGridView,
  onToggleView,
  onFavoritesPress,
}: SearchHeaderProps) {
  return (
    <View className='flex-row items-center justify-between mb-6 px-5'>
      <View className='flex-row gap-2'>
        <IconMapPinFilled size={30} color={COLORS.primary} />
        <DropdownButton
          bottomSheetLabel='Select Location'
          options={cities}
          value={selectedCity}
          onSelect={onSelectCity}
          textClassName='text-2xl text-text font-poppinsSemiBold leading-[34px]'
          buttonClassName='bg-transparent flex-row items-center justify-center gap-1'
          openIcon={IconChevronUp}
          closeIcon={IconChevronDown}
        />
      </View>

      <View className='flex-row items-center gap-4'>
        <TouchableOpacity activeOpacity={0.7} onPress={onFavoritesPress}>
          <IconHeart size={24} color={COLORS.grey} />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={onToggleView}>
          {isGridView ? (
            <IconLayoutGrid size={26} color={COLORS.grey} />
          ) : (
            <IconLayoutList size={26} color={COLORS.grey} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
