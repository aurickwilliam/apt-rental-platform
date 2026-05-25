import { View, Text } from 'react-native';

import { SearchField, Chip, Button } from 'heroui-native';

import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '@repo/constants';

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
          variant="tertiary"
          isIconOnly
        >
          <Ionicons
            name='options-outline'
            size={20}
            color={COLORS.text}
          />
        </Button>
      </View>

      {(activeFilterCount > 0 || resultCount !== undefined) && (
        <View className='flex-row items-center justify-between mt-1 mb-3'>
          {activeFilterCount > 0 ? (
            <Chip
              onPress={onClearFilters}
              variant='soft'
              color='accent'
              size='sm'
            >
              <Chip.Label>
                {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
              </Chip.Label>
              <Ionicons name='close' size={12} />
            </Chip>
          ) : (
            <View />
          )}

          {resultCount !== undefined && (
            <Text className='text-sm text-grey-500 font-inter'>
              {loading
                ? 'Searching...'
                : `${resultCount} ${resultCount === 1 ? 'apartment' : 'apartments'} found`}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}