import { View, Text } from "react-native";
import { useCallback, useMemo, useState, useEffect } from "react";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";

import {
  BottomSheet,
  Button,
  Slider,
  TagGroup,
  SearchField,
  Separator,
  Chip,
} from "heroui-native";

import {
  APARTMENT_TYPES,
  FURNISHED_TYPES,
  FLOOR_LEVELS,
  LEASE_DURATIONS,
  COLORS,
} from "@repo/constants";

import { PERKS } from "@/constants/perks";

const MAX_SIZE = 300;
const MIN_BUDGET = 1000;
const MAX_BUDGET = 50000;
const MIN_SIZE = 10;

const ROOM_OPTS = ["Any", "1", "2", "3", "4+"];

export type FilterState = {
  budget: [number, number];
  unitTypes: string[];
  sortBy: "newest" | "price_asc" | "price_desc" | "most_popular";
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
  sortBy: "newest",
  bedrooms: "Any",
  bathrooms: "Any",
  furnishing: FURNISHED_TYPES,
  floorLevel: FLOOR_LEVELS,
  leaseDuration: LEASE_DURATIONS,
  amenities: [],
};

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  resultCount?: number;
  initialFilters?: FilterState;
  onApply: (filters: FilterState) => void;
  onClear: () => void;
};

export default function FilterBottomSheet({
  isOpen,
  onOpenChange,
  resultCount,
  initialFilters = DEFAULT_FILTERS,
  onApply,
  onClear,
}: Props) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [amenitySearch, setAmenitySearch] = useState("");

  const toggleArrayItem = useCallback(
    (key: keyof FilterState, item: string) => {
      setFilters((prev) => {
        const arr = prev[key] as string[];
        return {
          ...prev,
          [key]: arr.includes(item)
            ? arr.filter((x) => x !== item)
            : [...arr, item],
        };
      });
    },
    [],
  );

  const handleClearAll = () => {
    setFilters(DEFAULT_FILTERS);
    onClear();
    onOpenChange(false);
  };

  const handleApply = () => {
    onApply(filters);
    onOpenChange(false);
  };

  const filteredPerks = useMemo(() => {
    const q = amenitySearch.toLowerCase().trim();
    return Object.values(PERKS)
      .filter((p) => q === "" || p.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const aSelected = filters.amenities.includes(a.id);
        const bSelected = filters.amenities.includes(b.id);
        return Number(bSelected) - Number(aSelected);
      });
  }, [amenitySearch, filters.amenities]);

  const handleSingleSelect =
    (key: keyof FilterState) => (keys: Set<string | number>) => {
      const val = Array.from(keys)[0] as string;
      if (val) setFilters((p) => ({ ...p, [key]: val }));
    };

  const handleMultiSelect =
    (key: keyof FilterState) => (keys: Set<string | number>) =>
      setFilters((p) => ({ ...p, [key]: Array.from(keys) as string[] }));

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          snapPoints={["85%"]}
          enableOverDrag={false}
          enableDynamicSizing={false}
          contentContainerClassName="h-full"
          handleIndicatorClassName="bg-[#D0D0D0] w-10"
          backgroundClassName="bg-white rounded-t-[20px]"
        >
          {/* Sticky Header */}
          <View className="border-b border-[#F0F0F0]">
            <View className="flex-row items-center justify-between">
              <Text className="font-interSemiBold text-base text-text mb-3">
                Filters
              </Text>

              {resultCount !== undefined && (
                <Text className="text-[#9E9E9E] font-interSemiBold text-[13px]">
                  {resultCount} results found
                </Text>
              )}
            </View>
          </View>

          {/* ── Scrollable Content ── */}
          <BottomSheetScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingTop: 16,
              paddingBottom: 32,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Budget */}
            <Slider
              value={filters.budget}
              onChange={(v) =>
                setFilters((p) => ({ ...p, budget: v as [number, number] }))
              }
              minValue={MIN_BUDGET}
              maxValue={MAX_BUDGET}
              step={500}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="font-interSemiBold text-base text-text">
                  Budget
                </Text>
                <Slider.Output>
                  {({ state }) => (
                    <Text className="font-interSemiBold text-sm text-primary">
                      ₱ {state.values[0].toLocaleString()} –{" "}
                      {state.values[1] >= MAX_BUDGET
                        ? `₱ ${MAX_BUDGET.toLocaleString()}+`
                        : `₱ ${state.values[1].toLocaleString()}`}
                    </Text>
                  )}
                </Slider.Output>
              </View>
              <Slider.Track>
                {({ state }) => (
                  <>
                    <Slider.Fill />
                    {state.values.map((_, i) => (
                      <Slider.Thumb key={i} index={i} />
                    ))}
                  </>
                )}
              </Slider.Track>
              <View className="flex-row justify-between mt-1">
                <Text className="text-[#9E9E9E] text-xs font-interRegular">
                  ₱ 1,000
                </Text>
                <Text className="text-[#9E9E9E] text-xs font-interRegular">
                  ₱ 50,000+
                </Text>
              </View>
            </Slider>

            <Separator className="my-4" />

            {/* Size Range */}
            <Slider
              value={filters.sizeRange}
              onChange={(v) =>
                setFilters((p) => ({ ...p, sizeRange: v as [number, number] }))
              }
              minValue={MIN_SIZE}
              maxValue={MAX_SIZE}
              step={5}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="font-interSemiBold text-base text-text">
                  Size Range
                </Text>
                <Slider.Output>
                  {({ state }) => (
                    <Text className="font-interSemiBold text-sm text-primary">
                      {state.values[0]} sqm – {state.values[1]} sqm
                    </Text>
                  )}
                </Slider.Output>
              </View>
              <Slider.Track>
                {({ state }) => (
                  <>
                    <Slider.Fill />
                    {state.values.map((_, i) => (
                      <Slider.Thumb key={i} index={i} />
                    ))}
                  </>
                )}
              </Slider.Track>
              <View className="flex-row justify-between mt-1">
                <Text className="text-[#9E9E9E] text-xs font-interRegular">
                  10 sqm
                </Text>
                <Text className="text-[#9E9E9E] text-xs font-interRegular">
                  300 sqm
                </Text>
              </View>
            </Slider>

            <Separator className="my-4" />

            {/* Sort By */}
            <Text className="font-interSemiBold text-base text-text mb-3">
              Sort By
            </Text>
            <TagGroup
              selectionMode="single"
              selectedKeys={new Set([filters.sortBy])}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0] as FilterState["sortBy"];
                if (val) setFilters((p) => ({ ...p, sortBy: val }));
              }}
            >
              <TagGroup.List className="flex-row flex-wrap gap-2">
                <TagGroup.Item id="newest">Newest</TagGroup.Item>
                <TagGroup.Item id="price_asc">Price: Low to High</TagGroup.Item>
                <TagGroup.Item id="price_desc">
                  Price: High to Low
                </TagGroup.Item>
                <TagGroup.Item id="most_popular">Most Popular</TagGroup.Item>
              </TagGroup.List>
            </TagGroup>

            <Separator className="my-4" />

            <Text className="font-interSemiBold text-base text-text mb-3">
              Bedrooms
            </Text>
            <TagGroup
              selectionMode="single"
              selectedKeys={new Set([filters.bedrooms])}
              onSelectionChange={handleSingleSelect("bedrooms")}
            >
              <TagGroup.List className="flex-row flex-wrap gap-2">
                {ROOM_OPTS.map((opt) => (
                  <TagGroup.Item key={opt} id={opt}>
                    {opt}
                  </TagGroup.Item>
                ))}
              </TagGroup.List>
            </TagGroup>

            <Separator className="my-4" />

            <Text className="font-interSemiBold text-base text-text mb-3">
              Bathrooms
            </Text>
            <TagGroup
              selectionMode="single"
              selectedKeys={new Set([filters.bathrooms])}
              onSelectionChange={handleSingleSelect("bathrooms")}
            >
              <TagGroup.List className="flex-row flex-wrap gap-2">
                {ROOM_OPTS.map((opt) => (
                  <TagGroup.Item key={opt} id={opt}>
                    {opt}
                  </TagGroup.Item>
                ))}
              </TagGroup.List>
            </TagGroup>

            <Separator className="my-4" />

            <Text className="font-interSemiBold text-base text-text mb-3">
              Unit Type
            </Text>
            <TagGroup
              selectionMode="multiple"
              selectedKeys={new Set(filters.unitTypes)}
              onSelectionChange={handleMultiSelect("unitTypes")}
            >
              <TagGroup.List className="flex-row flex-wrap gap-2">
                {APARTMENT_TYPES.map((type) => (
                  <TagGroup.Item key={type} id={type}>
                    {type}
                  </TagGroup.Item>
                ))}
              </TagGroup.List>
            </TagGroup>

            <Separator className="my-4" />

            <Text className="font-interSemiBold text-base text-text mb-3">
              Furnishing
            </Text>
            <TagGroup
              selectionMode="multiple"
              selectedKeys={new Set(filters.furnishing)}
              onSelectionChange={handleMultiSelect("furnishing")}
            >
              <TagGroup.List className="flex-row flex-wrap gap-2">
                {FURNISHED_TYPES.map((type) => (
                  <TagGroup.Item key={type} id={type}>
                    {type}
                  </TagGroup.Item>
                ))}
              </TagGroup.List>
            </TagGroup>

            <Separator className="my-4" />

            <Text className="font-interSemiBold text-base text-text mb-3">
              Floor Level
            </Text>
            <TagGroup
              selectionMode="multiple"
              selectedKeys={new Set(filters.floorLevel)}
              onSelectionChange={handleMultiSelect("floorLevel")}
            >
              <TagGroup.List className="flex-row flex-wrap gap-2">
                {FLOOR_LEVELS.map((level) => (
                  <TagGroup.Item key={level} id={level}>
                    {level}
                  </TagGroup.Item>
                ))}
              </TagGroup.List>
            </TagGroup>

            <Separator className="my-4" />

            <Text className="font-interSemiBold text-base text-text mb-3">
              Lease Duration
            </Text>
            <TagGroup
              selectionMode="multiple"
              selectedKeys={new Set(filters.leaseDuration)}
              onSelectionChange={handleMultiSelect("leaseDuration")}
            >
              <TagGroup.List className="flex-row flex-wrap gap-2">
                {LEASE_DURATIONS.map((duration) => (
                  <TagGroup.Item key={duration} id={duration}>
                    {duration}
                  </TagGroup.Item>
                ))}
              </TagGroup.List>
            </TagGroup>

            <Separator className="my-4" />

            <Text className="font-interSemiBold text-base text-text mb-3">
              Amenities
            </Text>
            <SearchField value={amenitySearch} onChange={setAmenitySearch}>
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Search amenities..." />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>

            <Separator className="my-4" />

            <View className="flex-row flex-wrap gap-2">
              {filteredPerks.map((perk) => {
                const isSelected = filters.amenities.includes(perk.id);
                const Icon = perk.icon;
                return (
                  <Chip
                    key={perk.id}
                    variant={isSelected ? 'soft' : 'secondary'}
                    color={isSelected ? 'accent' : 'default'}
                    onPress={() => toggleArrayItem('amenities', perk.id)}
                  >
                    <Icon size={14} color={isSelected ? COLORS.primary : '#555555'} />
                    <Chip.Label>{perk.name}</Chip.Label>
                  </Chip>
                );
              })}

              {filteredPerks.length === 0 && (
                <Text className="text-[#9E9E9E] font-interSemiBold text-[13px]">
                  No amenities match your search.
                </Text>
              )}
            </View>
          </BottomSheetScrollView>

          {/* Sticky Footer */}
          <View className="border-t border-[#F0F0F0] pt-3">
            <View className="flex-row items-center justify-between mb-3 gap-5">
              <Button className="flex-1" onPress={handleApply} size="sm">
                <Button.Label>Apply Filters</Button.Label>
              </Button>

              <Button onPress={handleClearAll} variant="tertiary" size="sm">
                <Button.Label>Clear All</Button.Label>
              </Button>
            </View>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
