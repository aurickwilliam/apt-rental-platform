import { View, Text } from 'react-native';

import { SearchField, Chip, Button } from 'heroui-native';

import { SlidersHorizontal, X } from 'lucide-react-native';

import { useColors } from 'hooks/useTheme';

type SearchFiltersBarProps = {
  searchValue: string;
  onChangeSearch: (value: string) => void;
  onFilterPress: () => void;
  activeFilterCount: number;
  resultCount?: number;
  loading: boolean;
  onClearFilters: () => void;
};

export default function SearchFiltersBar({
  searchValue,
  onChangeSearch,
  onFilterPress,
  activeFilterCount,
  resultCount,
  loading,
  onClearFilters,
}: SearchFiltersBarProps) {
  const { colors } = useColors();

  return (
    <View className='px-5'>
      <View className='flex-row items-center gap-2'>
        <View className='flex-1'>
          <SearchField 
            value={searchValue} 
            onChange={onChangeSearch}
          >
            <SearchField.Group>
              <SearchField.SearchIcon />

              <SearchField.Input 
                placeholder='Search apartments...' 
              />

              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </View>

        <Button
          onPress={onFilterPress}
          variant="ghost"
          isIconOnly
        >
          <SlidersHorizontal
            size={24}
            color={colors.gray500}
          />
        </Button>
      </View>

      {(activeFilterCount > 0 || resultCount !== undefined) && (
        <View className='flex-row items-center justify-between mt-2 mb-3'>
          {activeFilterCount > 0 ? (
            <>
              <Chip
                onPress={onClearFilters}
                variant='soft'
                color='accent'
                size='sm'
              >
                <Chip.Label>
                  {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
                </Chip.Label>
                <X size={12} strokeWidth={2} color={colors.primary} />
              </Chip>

              {resultCount !== undefined && (
                <Text className='text-xs text-gray-500 font-inter'>
                  {loading
                    ? 'Searching...'
                    : `${resultCount} ${resultCount === 1 ? 'apartment' : 'apartments'} found`}
                </Text>
              )}
            </>
          ) : (
            <View />
          )}
        </View>
      )}
    </View>
  );
}