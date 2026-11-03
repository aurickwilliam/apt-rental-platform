import { useRef } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SearchField, Chip } from 'heroui-native';
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
  onFocusChange?: (focused: boolean) => void;
  /** Bottom edge of the search field row, in the parent's coordinates. */
  onFieldBottomChange?: (bottom: number) => void;
  /** Rendered under the field (the city chips), above the result count row. */
  belowField?: React.ReactNode;
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
  onFocusChange,
  onFieldBottomChange,
  belowField,
}: SearchFiltersBarProps) {
  const { colors } = useColors();
  const barY = useRef(0);
  const rowBottom = useRef(0);
  const reportBottom = () => onFieldBottomChange?.(barY.current + rowBottom.current);
  // The row under the field exists only when it has something to show, so the
  // default Explore view has no empty row (and no margins) above its first section.
  const showCount = !loading && resultCount !== undefined;
  const hasMeta = activeFilterCount > 0 || showCount;
  return (
    <View
      className='px-5 pb-3'
      onLayout={(event) => {
        barY.current = event.nativeEvent.layout.y;
        reportBottom();
      }}
    >
      <View
        onLayout={(event) => {
          rowBottom.current = event.nativeEvent.layout.y + event.nativeEvent.layout.height;
          reportBottom();
        }}
      >
        {/* One rounded bar: magnifier, field, then the filter entry behind a
            divider. Searching is the keyboard's search key or the magnifier. */}
        <SearchField
          value={searchValue}
          onChange={onChangeSearch}
        >
          <SearchField.Group className='rounded-full'>
            <SearchField.Input
              placeholder='Search apartments...'
              returnKeyType='search'
              enterKeyHint='search'
              autoCorrect={false}
              autoCapitalize='none'
              onFocus={() => onFocusChange?.(true)}
              onBlur={() => onFocusChange?.(false)}
              onSubmitEditing={onSubmitSearch}
              blurOnSubmit
              className='ps-12 pe-16 rounded-full'
            />

            <Pressable
              onPress={onSubmitSearch}
              hitSlop={8}
              accessibilityRole='button'
              accessibilityLabel='Search'
              className='absolute inset-s-4 z-10'
            >
              <IconSearch size={20} color={colors.gray500} />
            </Pressable>

            <SearchField.ClearButton
              onPress={onClearSearch}
              className="inset-e-14!"
            />

            <View className='absolute inset-e-3 z-10 flex-row items-center gap-1'>
              <View className='w-px h-5 bg-gray-300 mr-1' />
              <View className='relative'>
                <Pressable
                  onPress={onFilterPress}
                  hitSlop={4}
                  accessibilityRole='button'
                  accessibilityLabel='Filters'
                  className='size-9 items-center justify-center'
                >
                  <IconFilter2 size={22} color={colors.gray500} />
                </Pressable>
                {activeFilterCount > 0 && (
                  <View
                    pointerEvents='none'
                    className='absolute top-0 right-0 min-w-4.5 h-4.5 rounded-full bg-accent items-center justify-center px-1'
                  >
                    <Text className='text-[10px] font-nunitoSemiBold text-white'>
                      {activeFilterCount > 9 ? '9+' : activeFilterCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </SearchField.Group>
        </SearchField>
      </View>
      {belowField ? <View className='mt-3'>{belowField}</View> : null}
      {hasMeta ? (
        <View testID='search-meta-row' className='flex-row items-center justify-between mt-2'>
          {activeFilterCount > 0 ? (
            <Chip onPress={onClearFilters} variant='soft' color='accent' size='sm'>
              <Chip.Label>Clear filters</Chip.Label>
              <IconX size={12} strokeWidth={2} color={colors.primary} />
            </Chip>
          ) : (
            <View />
          )}
          {showCount ? (
            <Text className='text-xs text-gray-500 font-inter'>
              {`${resultCount} ${resultCount === 1 ? 'apartment' : 'apartments'} found`}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
