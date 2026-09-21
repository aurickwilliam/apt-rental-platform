import { View } from 'react-native';

import {
  IconLayoutGrid,
  IconLayoutRows,
  IconHeart,
  IconMap,
  IconMapPinFilled,
} from '@tabler/icons-react-native';

import DropdownButton from 'components/buttons/DropdownButton';

import { Button } from 'heroui-native';

import { useColors } from 'hooks/useTheme';

type SearchHeaderProps = {
  cities: string[];
  selectedCity: string;
  onSelectCity: (city: string) => void;
  isGridView: boolean;
  onToggleView: () => void;
  onFavoritesPress: () => void;
  isNetflixMode?: boolean;
  onMapPress?: () => void;
};

export default function SearchHeader({
  cities,
  selectedCity,
  onSelectCity,
  isGridView,
  onToggleView,
  onFavoritesPress,
  isNetflixMode = false,
  onMapPress,
}: SearchHeaderProps) {
  const { colors } = useColors();

  return (
    <View className='flex-row items-center justify-between mb-3 px-5'>
      <View className='flex-row gap-2'>
        <IconMapPinFilled size={30} color={colors.primary} />

        <DropdownButton
          label='Select Location'
          options={cities}
          value={selectedCity}
          onSelect={onSelectCity}
          textClassName='text-xl text-foreground font-nunitoBold leading-[34px]'
          buttonClassName='bg-transparent flex-row items-center justify-center gap-1'
        />
      </View>

      <View className='flex-row items-center gap-4'>
        <Button
          onPress={onFavoritesPress}
          variant='ghost'
          className='p-0'
          accessibilityLabel="Favorites"
          accessibilityRole="button"
        >
          <IconHeart size={24} color={colors.gray500} />
        </Button>

        <Button
          onPress={onMapPress}
          variant='ghost'
          className='p-0'
          accessibilityLabel="Map search"
          accessibilityRole="button"
        >
          <IconMap size={24} color={colors.gray500} />
        </Button>

        {!isNetflixMode && (
          <Button
            onPress={onToggleView}
            variant='ghost'
            className='p-0'
            accessibilityLabel="Toggle view"
            accessibilityRole="button"
          >
            {isGridView ? (
              <IconLayoutGrid size={24} color={colors.gray500} />
            ) : (
              <IconLayoutRows size={24} color={colors.gray500} />
            )}
          </Button>
        )}
      </View>
    </View>
  );
}
