"use client";

import { useState } from "react";

import {
  ButtonGroup,
  Button,
  Slider,
  DatePicker,
  DateValue,
  Divider,
  CheckboxGroup,
  Checkbox
} from "@heroui/react";

const BEDROOM_OPTIONS = ["Any", "1", "2", "3", "4+"];
const BATHROOM_OPTIONS = ["Any", "1", "2", "3", "4+"];
const FURNISHING_OPTIONS = ["Unfurnished", "Semi", "Fully"];
const FLOOR_OPTIONS = ["Ground", "Low", "Mid", "High"];
const LEASE_OPTIONS = ["6 mos", "1 year", "2 year+"];
const AMENITIES = [
  "Pet Friendly",
  "Pool",
  "Gym",
  "Security / CCTV",
  "Elevator",
  "Balcony",
  "Storage",
];

type Filters = {
  bedroom: string;
  bathroom: string;
  sizeRange: [number, number];
  moveInDate: DateValue | null;

  furnishing: typeof FURNISHING_OPTIONS[number][];
  floorLevel: typeof FLOOR_OPTIONS[number][];
  leaseDuration: typeof LEASE_OPTIONS[number][];
  parking: boolean;

  amenities: typeof AMENITIES[number][];
}

const INITIAL_FILTERS: Filters = {
  bedroom: "Any",
  bathroom: "Any",
  sizeRange: [50, 120],
  moveInDate: null,

  furnishing: ["Unfurnished", "Semi", "Fully"],
  floorLevel: ["Ground", "Low", "Mid", "High"],
  leaseDuration: ["6 mos", "1 year", "2 year+"],
  parking: false,

  amenities: [],
}

export default function FilterContainer() {
  const [resultCount, setResultCount] = useState<number>(0);

  const [filters, setFilters] = useState<Filters>({
    bedroom: "Any",
    bathroom: "Any",
    sizeRange: [50, 120],
    moveInDate: null,

    furnishing: ["Unfurnished", "Semi", "Fully"],
    floorLevel: ["Ground", "Low", "Mid", "High"],
    leaseDuration: ["6 mos", "1 year", "2 year+"],
    parking: false,

    amenities: [],
  });

  // Handle updating the filters object
  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="w-full md:w-1/4 bg-white rounded-xl p-4 border border-grey-300">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          Filters
        </h3>
        <p className="text-sm text-default-500">
          {resultCount} results found
        </p>
      </div>

      {/* Clear Button */}
      <div className="flex justify-end mb-4">
        <Button
          variant="light"
          size="sm"
          radius="full"
          color="primary"
          onPress={() => {setFilters(INITIAL_FILTERS); setResultCount(0)}}
        >
          Clear All
        </Button>
      </div>

      {/* Bedroom Filters */}
      <p className="text-sm font-medium mb-2">
        Bedrooms
      </p>

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

      {/* Bathroom Options */}
      <p className="text-sm font-medium mt-6 mb-2">
        Bathrooms
      </p>

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
          minValue={20}
          maxValue={200}
          step={10}
          value={filters.sizeRange}
          onChange={(val) => updateFilter("sizeRange", val as [number, number])}
          className="w-full"
          size="sm"
        />
      </div>

      {/* Preferred Move-In Date */}
      <DatePicker
        label="Preferred Move-In Date"
        labelPlacement="outside"
        className="mt-6"
        classNames={{
          label: "text-sm font-medium",
        }}
        value={filters.moveInDate}
        onChange={(date) => updateFilter("moveInDate", date)}
      />

      <Divider className="my-5" />

      {/* Furnishing */}
      <p className="text-sm font-medium mt-6 mb-2">
        Furnishing
      </p>

      <CheckboxGroup
        value={filters.furnishing}
        onValueChange={(value) => updateFilter("furnishing", value)}
        className="flex flex-col gap-2"
      >
        {FURNISHING_OPTIONS.map((option) => (
          <Checkbox key={option} value={option} size="sm">
            {option}
          </Checkbox>
        ))}
      </CheckboxGroup>

      {/* Floor Level */}
      <p className="text-sm font-medium mt-6 mb-2">
        Floor Level
      </p>

      <CheckboxGroup
        value={filters.floorLevel}
        onValueChange={(value) => updateFilter("floorLevel", value)}
        className="flex flex-col gap-2"
      >
        {FLOOR_OPTIONS.map((option) => (
          <Checkbox key={option} value={option} size="sm">
            {option}
          </Checkbox>
        ))}
      </CheckboxGroup>

      {/* Lease Duration */}
      <p className="text-sm font-medium mt-6 mb-2">
        Lease Duration
      </p>

      <CheckboxGroup
        value={filters.leaseDuration}
        onValueChange={(value) => updateFilter("leaseDuration", value)}
        className="flex flex-col gap-2"
      >
        {LEASE_OPTIONS.map((option) => (
          <Checkbox key={option} value={option} size="sm">
            {option}
          </Checkbox>
        ))}
      </CheckboxGroup>

      {/* Has Parking */}
      <p className="text-sm font-medium mt-6 mb-2">
        Parking
      </p>

      <Checkbox
        isSelected={filters.parking}
        onValueChange={(val) => updateFilter("parking", val)}
        size="sm"
      >
        Parking included
      </Checkbox>

      <Divider className="my-5" />

      {/* Amenities */}
      <p className="text-sm font-medium mt-6 mb-2">
        Amenities
      </p>

      <CheckboxGroup
        value={filters.amenities}
        onValueChange={(val) => updateFilter("amenities", val)}
      >
        {AMENITIES.map((amenity) => (
          <Checkbox key={amenity} value={amenity} size="sm">
            {amenity}
          </Checkbox>
        ))}
      </CheckboxGroup>
    </div>
  );
}
