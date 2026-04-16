import { View, Text, TouchableOpacity } from 'react-native';
import { useCallback, useMemo, useState } from 'react';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';

import { APARTMENT_TYPES, FURNISHED_TYPES, FLOOR_LEVELS, LEASE_DURATIONS } from '@repo/constants';

import PillButton from '../buttons/PillButton';
import Divider from './Divider';
import SingleChipGroup from '../inputs/SingleChipGroup';
import MultiChipGroup from '../inputs/MultiChipGroup';
import RangeSlider from '../inputs/RangeSlider';

const MAX_SIZE      = 300;
const MIN_BUDGET    = 1000;
const MAX_BUDGET    = 50000;
const MIN_SIZE      = 10;

const ROOM_OPTS = ['Any', '1', '2', '3', '4+'];

const SORT_OPTIONS: { label: string; value: FilterState['sortBy'] }[] = [
  { label: 'Newest',             value: 'newest'       },
  { label: 'Price: Low to High', value: 'price_asc'    },
  { label: 'Price: High to Low', value: 'price_desc'   },
  { label: 'Most Popular',       value: 'most_popular' },
];

export type FilterState = {
  budget: [number, number];
  unitTypes: string[];
  sortBy: 'newest' | 'price_asc' | 'price_desc' | 'most_popular';
  bedrooms: string;
  bathrooms: string;
  sizeRange: [number, number];
  furnishing: string[];
  floorLevel: string[];
  leaseDuration: string[];
  amenities: string[];
};

export const DEFAULT_FILTERS: FilterState = {
  budget: [MIN_BUDGET, MAX_BUDGET],
  sizeRange: [MIN_SIZE, MAX_SIZE],
  unitTypes: APARTMENT_TYPES,
  sortBy: 'newest',
  bedrooms: 'Any',
  bathrooms: 'Any',
  furnishing: FURNISHED_TYPES,
  floorLevel: FLOOR_LEVELS,
  leaseDuration: LEASE_DURATIONS,
  amenities: [],
};

const AMENITIES = [
  'Parking', 'Swimming Pool', 'Gym', 'CCTV', 'Elevator',
  'Security', 'Pet Friendly', 'Wi-Fi', 'Laundry Area', 'Balcony',
];

type Props = {
  bottomSheetRef: React.RefObject<BottomSheet>;
  resultCount?: number;
  initialFilters?: FilterState;
  onApply: (filters: FilterState) => void;
  onClear: () => void;
};

export default function FilterBottomSheet({
  bottomSheetRef,
  resultCount,
  initialFilters = DEFAULT_FILTERS,
  onApply,
  onClear,
}: Props) {
  const snapPoints = useMemo(() => ['85%'], []);
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const toggleArrayItem = useCallback((key: keyof FilterState, item: string) => {
    setFilters((prev) => {
      const arr = prev[key] as string[];
      return {
        ...prev,
        [key]: arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item],
      };
    });
  }, []);

  const handleClearAll = () => {
    setFilters(DEFAULT_FILTERS);
    onClear();
    bottomSheetRef.current?.close();
  };

  const handleApply = () => {
    onApply(filters);
    bottomSheetRef.current?.close();
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: '#D0D0D0', width: 40 }}
      backgroundStyle={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
    >
      {/* ── Sticky Header ── */}
      <View className="px-5 py-3 border-b border-[#F0F0F0]">
        <View className="flex-row items-center justify-between">
          <Text className="font-poppinsMedium text-base text-text mb-3">
            Filters
          </Text>

          {resultCount !== undefined && (
            <Text className="text-[#9E9E9E] font-poppins text-[13px]">
              {resultCount} results found
            </Text>
          )}
        </View>
      </View>

      {/* ── Scrollable Content ── */}
      <BottomSheetScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Budget */}
        <RangeSlider
          label="Budget"
          min={MIN_BUDGET}
          max={MAX_BUDGET}
          values={filters.budget}
          step={500}
          onChange={(vals) => setFilters((p) => ({ ...p, budget: vals }))}
          format={(v) => `₱ ${v.toLocaleString()}`}
        />

        <Divider thickness={1} />

        {/* Size Range */}
        <RangeSlider
          label="Size Range"
          min={MIN_SIZE}
          max={MAX_SIZE}
          values={filters.sizeRange}
          step={5}
          onChange={(vals) => setFilters((p) => ({ ...p, sizeRange: vals }))}
          format={(v) => `${v} sqm`}
        />

        <Divider thickness={1} />

        {/* Sort By */}
        <Text className="font-poppinsMedium text-base text-text mb-3">
          Sort By
        </Text>

        <SingleChipGroup
          options={SORT_OPTIONS.map((o) => o.label)}
          selected={SORT_OPTIONS.find((o) => o.value === filters.sortBy)?.label ?? 'Newest'}
          onSelect={(label) => {
            const match = SORT_OPTIONS.find((o) => o.label === label);
            if (match) setFilters((p) => ({ ...p, sortBy: match.value }));
          }}
        />

        <Divider thickness={1} />

        {/* Bedrooms */}
        <Text className="font-poppinsMedium text-base text-text mb-3">
          Bedrooms
        </Text>

        <SingleChipGroup
          options={ROOM_OPTS}
          selected={filters.bedrooms}
          onSelect={(v) => setFilters((p) => ({ ...p, bedrooms: v }))}
        />

        <Divider thickness={1} />

        {/* Bathrooms */}
        <Text className="font-poppinsMedium text-base text-text mb-3">
          Bathrooms
        </Text>

        <SingleChipGroup
          options={ROOM_OPTS}
          selected={filters.bathrooms}
          onSelect={(v) => setFilters((p) => ({ ...p, bathrooms: v }))}
        />

        <Divider thickness={1} />

        {/* Unit Type */}
        <Text className="font-poppinsMedium text-base text-text mb-3">
          Unit Type
        </Text>

        <MultiChipGroup
          options={APARTMENT_TYPES}
          selected={filters.unitTypes}
          onToggle={(item) => toggleArrayItem('unitTypes', item)}
        />

        <Divider thickness={1} />

        {/* Furnishing */}
        <Text className="font-poppinsMedium text-base text-text mb-3">
          Furnishing
        </Text>

        <MultiChipGroup
          options={FURNISHED_TYPES}
          selected={filters.furnishing}
          onToggle={(item) => toggleArrayItem('furnishing', item)}
        />

        <Divider thickness={1} />

        {/* Floor Level */}
        <Text className="font-poppinsMedium text-base text-text mb-3">
          Floor Level
        </Text>

        <MultiChipGroup
          options={FLOOR_LEVELS}
          selected={filters.floorLevel}
          onToggle={(item) => toggleArrayItem('floorLevel', item)}
        />

        <Divider thickness={1} />

        {/* Lease Duration */}
        <Text className="font-poppinsMedium text-base text-text mb-3">
          Lease Duration
        </Text>

        <MultiChipGroup
          options={LEASE_DURATIONS}
          selected={filters.leaseDuration}
          onToggle={(item) => toggleArrayItem('leaseDuration', item)}
        />

        <Divider thickness={1} />

        {/* Amenities */}
        <Text className="font-poppinsMedium text-base text-text mb-3">
          Amenities
        </Text>

        <MultiChipGroup
          options={AMENITIES}
          selected={filters.amenities}
          onToggle={(item) => toggleArrayItem('amenities', item)}
        />
      </BottomSheetScrollView>
        
      <View className="px-5 py-3 border-b border-[#F0F0F0]">
        <View className="flex-row items-center justify-between mb-3 gap-5">
          <View className='flex-1'>
            <PillButton 
              label='Apply Filters'
              size='sm'
              onPress={handleApply}
              isFullWidth
            />
          </View>

          <TouchableOpacity onPress={handleClearAll} activeOpacity={0.7}>
            <Text className="text-primary font-[Poppins_500Medium] text-[14px]">
              Clear All
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}