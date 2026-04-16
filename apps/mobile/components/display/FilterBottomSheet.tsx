import { View, Text, TouchableOpacity } from 'react-native';
import { useCallback, useMemo, useState } from 'react';
import BottomSheet, {
  BottomSheetScrollView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import Slider from '@react-native-community/slider';

import { COLORS, APARTMENT_TYPES, FURNISHED_TYPES, FLOOR_LEVELS, LEASE_DURATIONS } from '@repo/constants';

const MAX_SIZE   = 300;
const MIN_BUDGET = 1000;
const MAX_BUDGET = 50000;
const MIN_SIZE   = 10;

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

const ROOM_OPTS      = ['Any', '1', '2', '3', '4+'];
const AMENITIES      = ['Parking', 'Swimming Pool', 'Gym', 'CCTV', 'Elevator', 'Security', 'Pet Friendly', 'Wi-Fi', 'Laundry Area', 'Balcony'];
const SORT_OPTIONS: { label: string; value: FilterState['sortBy'] }[] = [
  { label: 'Newest',             value: 'newest'       },
  { label: 'Price: Low to High', value: 'price_asc'    },
  { label: 'Price: High to Low', value: 'price_desc'   },
  { label: 'Most Popular',       value: 'most_popular' },
];

function SectionTitle({ title }: { title: string }) {
  return (
    <Text className="font-[Poppins_600SemiBold] text-[15px] text-[#1A1A1A] mb-2.5">
      {title}
    </Text>
  );
}

function Divider() {
  return <View className="h-px bg-[#F0F0F0] my-4" />;
}

function CheckboxItem({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      className="flex-row items-center mb-2.5"
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View
        className={`w-[22px] h-[22px] rounded-[6px] border-2 items-center justify-center mr-2.5
          ${checked ? 'bg-primary border-primary' : 'border-[#D0D0D0]'}`}
      >
        {checked && (
          <Text className="text-white text-[13px] font-bold leading-4">✓</Text>
        )}
      </View>
      <Text className="font-[Poppins_400Regular] text-[14px] text-[#333333]">{label}</Text>
    </TouchableOpacity>
  );
}

function ChipGroup({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (val: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2 mb-1">
      {options.map((opt) => {
        const active = selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            className={`py-[7px] px-[18px] rounded-full ${active ? 'bg-primary' : 'bg-[#F2F2F2]'}`}
            onPress={() => onSelect(opt)}
            activeOpacity={0.7}
          >
            <Text
              className={`font-[Poppins_500Medium] text-[13px] ${active ? 'text-white' : 'text-[#555555]'}`}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function RadioItem({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <TouchableOpacity
      className="flex-row items-center mb-2.5"
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View
        className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2.5
          ${selected ? 'border-primary' : 'border-[#D0D0D0]'}`}
      >
        {selected && <View className="w-2.5 h-2.5 rounded-full bg-primary" />}
      </View>
      <Text className="font-[Poppins_400Regular] text-[14px] text-[#333333]">{label}</Text>
    </TouchableOpacity>
  );
}

function RangeSlider({
  label,
  min,
  max,
  low,
  high,
  onLowChange,
  onHighChange,
  format,
}: {
  label: string;
  min: number;
  max: number;
  low: number;
  high: number;
  onLowChange: (v: number) => void;
  onHighChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <View>
      <View className="flex-row justify-between items-center mb-1">
        <SectionTitle title={label} />
        <Text className="font-[Poppins_400Regular] text-[13px] text-[#9E9E9E]">
          {format(low)} – {format(high)}
        </Text>
      </View>

      {/* Low handle */}
      <Slider
        style={{ width: '100%', height: 36, marginHorizontal: -4 }}
        minimumValue={min}
        maximumValue={high - 1}
        value={low}
        step={label === 'Budget' ? 500 : 5}
        onValueChange={onLowChange}
        minimumTrackTintColor={COLORS.primary}
        maximumTrackTintColor="#E0E0E0"
        thumbTintColor={COLORS.primary}
      />
      {/* High handle */}
      <Slider
        style={{ width: '100%', height: 36, marginHorizontal: -4, marginTop: -10 }}
        minimumValue={low + 1}
        maximumValue={max}
        value={high}
        step={label === 'Budget' ? 500 : 5}
        onValueChange={onHighChange}
        minimumTrackTintColor="#E0E0E0"
        maximumTrackTintColor={COLORS.primary}
        thumbTintColor={COLORS.primary}
      />
    </View>
  );
}

function AmenitiesDropdown({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (item: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const label = selected.length === 0 ? 'Select amenities' : selected.join(', ');

  return (
    <View>
      <TouchableOpacity
        className="flex-row items-center justify-between border border-[#D0D0D0] rounded-[10px] px-3.5 py-3"
        onPress={() => setOpen((p) => !p)}
        activeOpacity={0.7}
      >
        <Text
          className="flex-1 font-[Poppins_400Regular] text-[14px] text-[#555555]"
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text className="text-[11px] text-[#9E9E9E] ml-2">{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {open && (
        <View className="mt-2 border border-[#F0F0F0] rounded-[10px] p-3 bg-[#FAFAFA]">
          {AMENITIES.map((item) => (
            <CheckboxItem
              key={item}
              label={item}
              checked={selected.includes(item)}
              onToggle={() => onToggle(item)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

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
      // BottomSheet-specific style props — cannot use className here
      handleIndicatorStyle={{ backgroundColor: '#D0D0D0', width: 40 }}
      backgroundStyle={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
    >
      {/* ── Sticky Header ── */}
      <View className="px-5 pb-3 border-b border-[#F0F0F0]">
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity
            className="bg-primary py-2.5 px-5 rounded-full"
            onPress={handleApply}
            activeOpacity={0.85}
          >
            <Text className="text-white font-[Poppins_600SemiBold] text-[14px]">
              Search Apartment
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleClearAll} activeOpacity={0.7}>
            <Text className="text-primary font-[Poppins_500Medium] text-[14px]">Clear All</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="font-[Poppins_600SemiBold] text-[15px] text-[#1A1A1A]">Filters</Text>
          {resultCount !== undefined && (
            <Text className="text-[#9E9E9E] font-[Poppins_400Regular] text-[13px]">
              {resultCount} results found
            </Text>
          )}
        </View>
      </View>

      {/* ── Scrollable Content ── */}
      {/* contentContainerStyle is a ScrollView-specific prop — cannot use className here */}
      <BottomSheetScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >        

        {/* Budget */}
        <RangeSlider
          label="Budget"
          min={MIN_BUDGET}
          max={MAX_BUDGET}
          low={filters.budget[0]}
          high={filters.budget[1]}
          onLowChange={(v) => setFilters((p) => ({ ...p, budget: [Math.round(v), p.budget[1]] }))}
          onHighChange={(v) => setFilters((p) => ({ ...p, budget: [p.budget[0], Math.round(v)] }))}
          format={(v) => `₱${v.toLocaleString()}`}
        />

        <Divider />

        {/* Unit Type */}
        <SectionTitle title="Unit Type" />
        {APARTMENT_TYPES.map((ut) => (
          <CheckboxItem
            key={ut}
            label={ut}
            checked={filters.unitTypes.includes(ut)}
            onToggle={() => toggleArrayItem('unitTypes', ut)}
          />
        ))}

        <Divider />

        {/* Sort By */}
        <SectionTitle title="Sort By" />
        {SORT_OPTIONS.map((opt) => (
          <RadioItem
            key={opt.value}
            label={opt.label}
            selected={filters.sortBy === opt.value}
            onSelect={() => setFilters((p) => ({ ...p, sortBy: opt.value }))}
          />
        ))}

        <Divider />

        {/* Bedrooms */}
        <SectionTitle title="Bedrooms" />
        <ChipGroup
          options={ROOM_OPTS}
          selected={filters.bedrooms}
          onSelect={(v) => setFilters((p) => ({ ...p, bedrooms: v }))}
        />

        <Divider />

        {/* Bathrooms */}
        <SectionTitle title="Bathrooms" />
        <ChipGroup
          options={ROOM_OPTS}
          selected={filters.bathrooms}
          onSelect={(v) => setFilters((p) => ({ ...p, bathrooms: v }))}
        />

        <Divider />

        {/* Size Range */}
        <RangeSlider
          label="Size Range"
          min={MIN_SIZE}
          max={MAX_SIZE}
          low={filters.sizeRange[0]}
          high={filters.sizeRange[1]}
          onLowChange={(v) => setFilters((p) => ({ ...p, sizeRange: [Math.round(v), p.sizeRange[1]] }))}
          onHighChange={(v) => setFilters((p) => ({ ...p, sizeRange: [p.sizeRange[0], Math.round(v)] }))}
          format={(v) => `${v} sqm`}
        />

        <Divider />

        {/* Furnishing */}
        <SectionTitle title="Furnishing" />
        {FURNISHED_TYPES.map((f) => (
          <CheckboxItem
            key={f}
            label={f}
            checked={filters.furnishing.includes(f)}
            onToggle={() => toggleArrayItem('furnishing', f)}
          />
        ))}

        <Divider />

        {/* Floor Level */}
        <SectionTitle title="Floor Level" />
        {FLOOR_LEVELS.map((fl) => (
          <CheckboxItem
            key={fl}
            label={fl}
            checked={filters.floorLevel.includes(fl)}
            onToggle={() => toggleArrayItem('floorLevel', fl)}
          />
        ))}

        <Divider />

        {/* Lease Duration */}
        <SectionTitle title="Lease Duration" />
        {LEASE_DURATIONS.map((ld) => (
          <CheckboxItem
            key={ld}
            label={ld}
            checked={filters.leaseDuration.includes(ld)}
            onToggle={() => toggleArrayItem('leaseDuration', ld)}
          />
        ))}

        <Divider />

        {/* Amenities */}
        <SectionTitle title="Amenities" />
        <AmenitiesDropdown
          selected={filters.amenities}
          onToggle={(item) => toggleArrayItem('amenities', item)}
        />

        <View className="h-8" />
      </BottomSheetScrollView>
    </BottomSheet>
  );
}