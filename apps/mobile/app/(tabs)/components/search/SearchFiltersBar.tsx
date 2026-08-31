import { View, Text, Pressable } from 'react-native';
import { SearchField, Chip, Button } from 'heroui-native';
import { IconFilter2, IconSearch, IconX } from '@tabler/icons-react-native';
import { useColors } from 'hooks/useTheme';

type SearchFiltersBarProps = {
  searchValue: string;
  onChangeSearch: (value: string) => void;
  onSubmitSearch: () => void;
  onClearSearch: () => void;
  onFilterPress: () => void;
  activeFilterCount: number;
  resultCount?: number;
  loading: boolean;
  onClearFilters: () => void;
  selectedCity?: string;
  committedSearch?: string;
};

export default function SearchFiltersBar({
  searchValue,
  onChangeSearch,
  onSubmitSearch,
  onClearSearch,
  onFilterPress,
  activeFilterCount,
  resultCount,
  loading,
  onClearFilters,
  selectedCity = "CAMANAVA",
  committedSearch = "",
}: SearchFiltersBarProps) {
  const { colors } = useColors();
  const isTyping = searchValue.trim() !== '';
  return (
    <View className='px-5'>
      <View className='flex-row items-center gap-2'>
        <View className='flex-1'>
          <SearchField
            value={searchValue}
            onChange={onChangeSearch}
          >
            <SearchField.Group>
              <SearchField.Input
                placeholder='Search apartments...'
                returnKeyType='search'
                enterKeyHint='search'
                autoCorrect={false}
                autoCapitalize='none'
                onSubmitEditing={onSubmitSearch}
                blurOnSubmit
                className='ps-3 pe-20'
              />

              <SearchField.ClearButton
                onPress={onClearSearch}
                className="inset-e-10!"
              />

              <Pressable
                onPress={onSubmitSearch}
                hitSlop={8}
                accessibilityRole='button'
                accessibilityLabel='Search'
                className='absolute inset-e-3 z-10'
              >
                <IconSearch size={20} color={colors.gray500} />
              </Pressable>
            </SearchField.Group>
          </SearchField>
        </View>
        {!isTyping && (
          <View className='relative'>
            <Button onPress={onFilterPress} variant='tertiary' isIconOnly>
              <IconFilter2 size={24} color={colors.gray500} />
            </Button>
            {activeFilterCount > 0 && (
              <View
                pointerEvents='none'
                className='absolute -top-1 -right-1 min-w-4.5 h-4.5 rounded-full bg-accent items-center justify-center px-1'
              >
                <Text className='text-[10px] font-nunitoSemiBold text-white'>
                  {activeFilterCount > 9 ? '9+' : activeFilterCount}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
      <View className='flex-row items-center justify-between mt-2 mb-3'>
        {activeFilterCount > 0 ? (
          <Chip onPress={onClearFilters} variant='soft' color='accent' size='sm'>
            <Chip.Label>Clear filters</Chip.Label>
            <IconX size={12} strokeWidth={2} color={colors.primary} />
          </Chip>
        ) : (
          <View />
        )}
        {!loading && resultCount !== undefined ? (
          <Text className='text-xs text-gray-500 font-inter'>
            {`${resultCount} ${resultCount === 1 ? 'apartment' : 'apartments'} found`}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
