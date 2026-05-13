import { View, TouchableOpacity, Text } from 'react-native';

import SearchField from 'components/inputs/SearchField';

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
      <SearchField
        searchValue={searchValue}
        onChangeSearch={onChangeSearch}
        showFilterButton
        onFilterPress={onFilterPress}
      />

      {(activeFilterCount > 0 || resultCount !== undefined) && (
        <View className='flex-row items-center justify-between my-3'>
          {activeFilterCount > 0 ? (
            <>
              <TouchableOpacity
                onPress={onClearFilters}
                activeOpacity={0.7}
                className='flex-row items-center gap-1 bg-primary/10 rounded-full px-3 py-1'
              >
                <Text className='text-primary text-sm font-poppinsMedium'>
                  {activeFilterCount} {activeFilterCount === 1 ? 'filter' : 'filters'} active
                </Text>
                <Text className='text-primary text-sm font-poppinsBold'>✕</Text>
              </TouchableOpacity>

              {resultCount !== undefined && (
                <Text className='text-sm text-grey-500 font-poppinsRegular'>
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
