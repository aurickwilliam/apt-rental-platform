import { View } from 'react-native';

import {
  MapPin,
  LayoutGrid,
  Rows3,
  Heart,
} from 'lucide-react-native';

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
};

export default function SearchHeader({
  cities,
  selectedCity,
  onSelectCity,
  isGridView,
  onToggleView,
  onFavoritesPress,
}: SearchHeaderProps) {
  const { colors } = useColors();

  return (
    <View className='flex-row items-center justify-between mb-3 px-5'>
      <View className='flex-row gap-2'>
        <MapPin size={30} color={colors.primary} />

        <DropdownButton
          bottomSheetLabel='Select Location'
          options={cities}
          value={selectedCity}
          onSelect={onSelectCity}
          textClassName='text-xl text-foreground font-nunitoSemiBold leading-[34px]'
          buttonClassName='bg-transparent flex-row items-center justify-center gap-1'
        />
      </View>

      <View className='flex-row items-center gap-4'>
        <Button 
          onPress={onFavoritesPress} 
          variant='ghost' 
          className='p-0'
        >
          <Heart size={24} color={colors.gray500} />
        </Button>

        <Button
          onPress={onToggleView}
          variant='ghost'
          className='p-0'
        >
          {isGridView ? (
            <LayoutGrid size={24} color={colors.gray500} />
          ) : (
            <Rows3 size={24} color={colors.gray500} />
          )}
        </Button>
      </View>
    </View>
  );
}
