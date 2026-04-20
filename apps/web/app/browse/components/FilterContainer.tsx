"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  ButtonGroup,
  Button,
  Slider,
  Divider,
  CheckboxGroup,
  Checkbox,
  RadioGroup,
  Radio,
} from "@heroui/react";
import { Search } from "lucide-react";
import {
  APARTMENT_TYPES,
  FURNISHED_TYPES,
  FLOOR_LEVELS,
  LEASE_DURATIONS,
} from "@repo/constants";

import AmenitiesSelect from "../../components/inputs/AmenitiesSelect";
import { PERKS } from "../../components/inputs/perks";

const LOCATIONS = ["Caloocan", "Malabon", "Navotas", "Valenzuela"];

const MIN_BUDGET = 1000;
const MAX_BUDGET = 50000;
const MIN_SIZE = 10;
const MAX_SIZE = 300;

const BEDROOM_OPTIONS = ["Any", "1", "2", "3", "4+"];
const BATHROOM_OPTIONS = ["Any", "1", "2", "3", "4+"];
const SORT_OPTIONS = [
  { value: "newest",     label: "Newest" },
  { value: "price_asc",  label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "popular",    label: "Most Popular" },
];

type Filters = {
  locations: string[];
  priceRange: [number, number];
  aptTypes: string[];
  bedroom: string;
  bathroom: string;
  sizeRange: [number, number];
  furnishing: string[];
  floorLevel: string[];
  leaseDuration: string[];
  amenities: string[];
  sortBy: string;
};

const INITIAL_FILTERS: Filters = {
  locations: [...LOCATIONS],
  priceRange: [MIN_BUDGET, MAX_BUDGET],
  aptTypes: [...APARTMENT_TYPES],
  bedroom: "Any",
  bathroom: "Any",
  sizeRange: [MIN_SIZE, MAX_SIZE],
  furnishing: [...FURNISHED_TYPES],
  floorLevel: [...FLOOR_LEVELS],
  leaseDuration: [...LEASE_DURATIONS],
  amenities: [],
  sortBy: "newest",
};

type Props = {
  resultCount: number;
};

export default function FilterContainer({ resultCount }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<Filters>(() => {
    const locsRaw = searchParams.get("locations");
    const typesRaw = searchParams.get("apt_types");

    return {
      locations:     locsRaw ? locsRaw.split(",") : [...LOCATIONS],
      priceRange: [
        Number(searchParams.get("price_min") ?? MIN_BUDGET),
        Number(searchParams.get("price_max") ?? MAX_BUDGET),
      ] as [number, number],
      aptTypes: typesRaw ? typesRaw.split(",") : [...APARTMENT_TYPES],
      bedroom:       searchParams.get("bedrooms") ?? "Any",
      bathroom:      searchParams.get("bathrooms") ?? "Any",
      sizeRange:     [
        Number(searchParams.get("size_min") ?? MIN_SIZE),
        Number(searchParams.get("size_max") ?? MAX_SIZE),
      ] as [number, number],
      furnishing:    searchParams.get("furnishing")?.split(",") ?? [...FURNISHED_TYPES],
      floorLevel:    searchParams.get("floor_level")?.split(",") ?? [...FLOOR_LEVELS],
      leaseDuration: searchParams.get("lease")?.split(",") ?? [...LEASE_DURATIONS],
      amenities:     searchParams.get("amenities")?.split(",").filter(Boolean) ?? [],
      sortBy:        searchParams.get("sort") ?? "newest",
    };
  });

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    const current = new URLSearchParams();
    current.delete("page");

    // Locations
    if (filters.locations.length > 0) current.set("locations", filters.locations.join(","));

    // Price range
    current.set("price_min", String(filters.priceRange[0]));
    if (filters.priceRange[1] < MAX_BUDGET) {
      current.set("price_max", String(filters.priceRange[1]));
    }

    // Apartment types
    if (filters.aptTypes.length > 0) current.set("apt_types", filters.aptTypes.join(","));

    // Bedrooms
    if (filters.bedroom !== "Any") current.set("bedrooms", filters.bedroom);

    // Bathrooms
    if (filters.bathroom !== "Any") current.set("bathrooms", filters.bathroom);

    // Size range
    current.set("size_min", String(filters.sizeRange[0]));
    current.set("size_max", String(filters.sizeRange[1]));

    // Furnishing
    if (filters.furnishing.length < FURNISHED_TYPES.length)
      current.set("furnishing", filters.furnishing.join(","));

    // Floor level
    if (filters.floorLevel.length < FLOOR_LEVELS.length)
      current.set("floor_level", filters.floorLevel.join(","));

    // Lease duration
    if (filters.leaseDuration.length < LEASE_DURATIONS.length)
      current.set("lease", filters.leaseDuration.join(","));

    // Amenities
    if (filters.amenities.length > 0)
      current.set("amenities", filters.amenities.join(","));

    // Sort
    if (filters.sortBy !== "newest") current.set("sort", filters.sortBy);

    router.push(`/browse?${current.toString()}`);
  };

  const handleClear = () => {
    setFilters(INITIAL_FILTERS);
    router.push("/browse");
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-grey-300">
      <div className="flex gap-3 items-center justify-center mb-5">
        {/* Search Button */}
        <Button
          color="primary"
          className="w-full"
          radius="full"
          onPress={handleApply}
          startContent={
            <Search size={20} />
          }
        >
          Search Apartment
        </Button>

        <Button
          variant="light"
          radius="full"
          color="primary"
          onPress={handleClear}
        >
          Clear All
        </Button>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-medium">Filters</h3>
        <p className="text-sm text-default-500">{resultCount} results found</p>
      </div>

      {/* Location */}
      <p className="text-sm font-medium mb-2">Location</p>
      <CheckboxGroup
        value={filters.locations}
        onValueChange={(val) => updateFilter("locations", val)}
        className="flex flex-col gap-2"
      >
        {LOCATIONS.map((option) => (
          <Checkbox key={option} value={option} size="sm">{option}</Checkbox>
        ))}
      </CheckboxGroup>

      {/* Budget */}
      <div className="flex flex-col gap-2 mt-6">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Budget</span>
          <span className="text-sm text-default-500">
            ₱{filters.priceRange[0].toLocaleString()} – {filters.priceRange[1] === MAX_BUDGET ? `₱${MAX_BUDGET.toLocaleString()}+` : `₱${filters.priceRange[1].toLocaleString()}`}
          </span>
        </div>
        <Slider
          minValue={MIN_BUDGET}
          maxValue={MAX_BUDGET}
          step={500}
          value={filters.priceRange}
          onChange={(val) => updateFilter("priceRange", val as [number, number])}
          className="w-full"
          size="sm"
        />
      </div>

      {/* Unit Type */}
      <p className="text-sm font-medium mt-6 mb-2">Unit Type</p>
      <CheckboxGroup
        value={filters.aptTypes}
        onValueChange={(val) => updateFilter("aptTypes", val)}
        className="flex flex-col gap-2"
      >
        {APARTMENT_TYPES.map((type) => (
          <Checkbox key={type} value={type} size="sm">{type}</Checkbox>
        ))}
      </CheckboxGroup>

      <Divider className="my-5" />

      {/* Sort By */}
      <p className="text-sm font-medium mb-2">Sort By</p>
      <RadioGroup
        value={filters.sortBy}
        onValueChange={(val) => updateFilter("sortBy", val)}
      >
        {SORT_OPTIONS.map((opt) => (
          <Radio key={opt.value} value={opt.value} size="sm">
            {opt.label}
          </Radio>
        ))}
      </RadioGroup>

      {/* Bedrooms */}
      <p className="text-sm font-medium mb-2 mt-6">Bedrooms</p>
      <ButtonGroup variant="flat" className="w-full" radius="full">
        {BEDROOM_OPTIONS.map((option) => (
          <Button
            key={option}
            className="flex-1 min-w-0"
            onPress={() => updateFilter("bedroom", option)}
            color={filters.bedroom === option ? "primary" : "default"}
            variant={filters.bedroom === option ? "solid" : "flat"}
          >
            {option}
          </Button>
        ))}
      </ButtonGroup>

      {/* Bathrooms */}
      <p className="text-sm font-medium mt-6 mb-2">Bathrooms</p>
      <ButtonGroup variant="flat" className="w-full" radius="full">
        {BATHROOM_OPTIONS.map((option) => (
          <Button
            key={option}
            className="flex-1 min-w-0"
            onPress={() => updateFilter("bathroom", option)}
            color={filters.bathroom === option ? "primary" : "default"}
            variant={filters.bathroom === option ? "solid" : "flat"}
          >
            {option}
          </Button>
        ))}
      </ButtonGroup>

      {/* Size Range */}
      <div className="flex flex-col gap-2 mt-6">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Size Range</span>
          <span className="text-sm text-default-500">
            {filters.sizeRange[0]} – {filters.sizeRange[1]} sqm
          </span>
        </div>
        <Slider
          minValue={MIN_SIZE}
          maxValue={MAX_SIZE}
          step={5}
          value={filters.sizeRange}
          onChange={(val) => updateFilter("sizeRange", val as [number, number])}
          className="w-full"
          size="sm"
        />
      </div>

      <Divider className="my-5" />

      {/* Furnishing */}
      <p className="text-sm font-medium mb-2">Furnishing</p>
      <CheckboxGroup
        value={filters.furnishing}
        onValueChange={(val) => updateFilter("furnishing", val)}
        className="flex flex-col gap-2"
      >
        {FURNISHED_TYPES.map((option) => (
          <Checkbox key={option} value={option} size="sm">{option}</Checkbox>
        ))}
      </CheckboxGroup>

      {/* Floor Level */}
      <p className="text-sm font-medium mt-6 mb-2">Floor Level</p>
      <CheckboxGroup
        value={filters.floorLevel}
        onValueChange={(val) => updateFilter("floorLevel", val)}
        className="flex flex-col gap-2"
      >
        {FLOOR_LEVELS.map((option) => (
          <Checkbox key={option} value={option} size="sm">{option}</Checkbox>
        ))}
      </CheckboxGroup>

      {/* Lease Duration */}
      <p className="text-sm font-medium mt-6 mb-2">Lease Duration</p>
      <CheckboxGroup
        value={filters.leaseDuration}
        onValueChange={(val) => updateFilter("leaseDuration", val)}
        className="flex flex-col gap-2"
      >
        {LEASE_DURATIONS.map((option) => (
          <Checkbox key={option} value={option} size="sm">{option}</Checkbox>
        ))}
      </CheckboxGroup>

      <Divider className="my-5" />

      {/* Amenities */}
      <p className="text-sm font-medium mb-2">Amenities</p>
      <AmenitiesSelect
        amenities={Object.values(PERKS)}
        selected={filters.amenities}
        onChange={(val) => updateFilter("amenities", val)}
      />
    </div>
  );
}
