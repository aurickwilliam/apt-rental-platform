import { Text, View } from 'react-native';

import {
  IconHeart,
  IconLayoutGrid,
  IconLayoutRows,
  IconMap,
  IconSparkles,
} from '@tabler/icons-react-native';

import { Button } from 'heroui-native';

import { useColors } from 'hooks/useTheme';

type SearchHeaderProps = {
  isGridView: boolean;
  onToggleView: () => void;
  onFavoritesPress: () => void;
  isNetflixMode?: boolean;
  onMapPress?: () => void;
  onAskAvaPress?: () => void;
};

// Title row of the Explore tab: Ava, Favorites and the map at the right. The
// search field and filters sit in one bar below (SearchFiltersBar), and the city
// switch is the chip row under it.
export default function SearchHeader({
  isGridView,
  onToggleView,
  onFavoritesPress,
  isNetflixMode = false,
  onMapPress,
  onAskAvaPress,
}: SearchHeaderProps) {
  const { colors } = useColors();

  return (
    <View className='flex-row items-center justify-between mb-3 px-5'>
      <Text
        className='flex-1 pr-3 text-2xl text-primary font-nunitoBold'
        numberOfLines={1}
        accessibilityRole='header'
      >
        Find your next home
      </Text>

      <View className='flex-row items-center gap-4'>
        {onAskAvaPress && (
          <Button
            onPress={onAskAvaPress}
            variant='ghost'
            className='p-0'
            accessibilityLabel="Ask Ava, the APT Virtual Assistant"
            accessibilityRole="button"
          >
            <IconSparkles size={24} color={colors.primary} />
          </Button>
        )}

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
