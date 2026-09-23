"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  Button,
  Slider,
  Separator,
  CheckboxGroup,
  Checkbox,
  Chip,
  RadioGroup,
  Radio,
  Label,
  Spinner,
  Switch,
  ToggleButtonGroup,
  ToggleButton,
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
import { useDebouncedCallback } from "./use-debounced-callback";

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
  { value: "most_popular", label: "Most Popular" },
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
  verifiedOnly: boolean;
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
  verifiedOnly: false,
};

type Props = {
  resultCount: number;
};

const FILTER_DEBOUNCE_MS = 300;

function readFiltersFromParams(
  params: URLSearchParams,
  fallback: Filters = INITIAL_FILTERS,
): Filters {
  const locsRaw = params.get("locations");
  const typesRaw = params.get("apt_types");

  return {
    locations: locsRaw ? locsRaw.split(",") : [...fallback.locations],
    priceRange: [
      Number(params.get("price_min") ?? fallback.priceRange[0]),
      Number(params.get("price_max") ?? fallback.priceRange[1]),
    ] as [number, number],
    aptTypes: typesRaw ? typesRaw.split(",") : [...fallback.aptTypes],
    bedroom: params.get("bedrooms") ?? fallback.bedroom,
    bathroom: params.get("bathrooms") ?? fallback.bathroom,
    sizeRange: [
      Number(params.get("size_min") ?? fallback.sizeRange[0]),
      Number(params.get("size_max") ?? fallback.sizeRange[1]),
    ] as [number, number],
    furnishing: params.get("furnishing")?.split(",") ?? [...fallback.furnishing],
    floorLevel: params.get("floor_level")?.split(",") ?? [...fallback.floorLevel],
    leaseDuration: params.get("lease")?.split(",") ?? [...fallback.leaseDuration],
    amenities: params.get("amenities")?.split(",").filter(Boolean) ?? [...fallback.amenities],
    sortBy: params.get("sort") ?? fallback.sortBy,
    verifiedOnly: params.get("verified") === "1",
  };
}

function serializeFilters(f: Filters, search: string | null): string {
  const current = new URLSearchParams();

  // Preserve text search from SearchContainer
  if (search) current.set("search", search);

  // Locations
  if (f.locations.length > 0 && f.locations.length < LOCATIONS.length)
    current.set("locations", f.locations.join(","));

  // Price range
  if (f.priceRange[0] > MIN_BUDGET)
    current.set("price_min", String(f.priceRange[0]));
  if (f.priceRange[1] < MAX_BUDGET)
    current.set("price_max", String(f.priceRange[1]));

  // Apartment types
  if (f.aptTypes.length > 0 && f.aptTypes.length < APARTMENT_TYPES.length)
    current.set("apt_types", f.aptTypes.join(","));

  // Bedrooms
  if (f.bedroom !== "Any") current.set("bedrooms", f.bedroom);

  // Bathrooms
  if (f.bathroom !== "Any") current.set("bathrooms", f.bathroom);

  // Size range
  if (f.sizeRange[0] > MIN_SIZE)
    current.set("size_min", String(f.sizeRange[0]));
  if (f.sizeRange[1] < MAX_SIZE)
    current.set("size_max", String(f.sizeRange[1]));

  // Furnishing (skip when fully deselected — empty means "no filter")
  if (f.furnishing.length > 0 && f.furnishing.length < FURNISHED_TYPES.length)
    current.set("furnishing", f.furnishing.join(","));

  // Floor level
  if (f.floorLevel.length > 0 && f.floorLevel.length < FLOOR_LEVELS.length)
    current.set("floor_level", f.floorLevel.join(","));

  // Lease duration
  if (f.leaseDuration.length > 0 && f.leaseDuration.length < LEASE_DURATIONS.length)
    current.set("lease", f.leaseDuration.join(","));

  // Amenities
  if (f.amenities.length > 0)
    current.set("amenities", f.amenities.join(","));

  // Sort
  if (f.sortBy !== "newest") current.set("sort", f.sortBy);

  // Verified listings only
  if (f.verifiedOnly) current.set("verified", "1");

  return current.toString();
}

export default function FilterContainer({ resultCount }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useState<Filters>(() =>
    readFiltersFromParams(searchParams),
  );

  // Mirrors kept fresh in effects so event handlers and scheduled pushes
  // never read stale closures.
  const searchParamsRef = useRef(searchParams);
  const filtersRef = useRef(filters);

  useEffect(() => {
    searchParamsRef.current = searchParams;
  }, [searchParams]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Signature of the last URL this panel pushed. The URL→state sync below
  // ignores echoes of our own pushes, so in-flight interaction (e.g. a
  // slider drag with a pending debounced push) is never clobbered.
  const lastPushedRef = useRef<string | null>(null);

  const pushFilters = (next: Filters) => {
    const query = serializeFilters(next, searchParamsRef.current.get("search"));
    lastPushedRef.current = query;
    startTransition(() => {
      router.replace(query ? `/browse?${query}` : "/browse");
    });
  };

  const { debounced: debouncedPush, cancel: cancelPush } =
    useDebouncedCallback(pushFilters, FILTER_DEBOUNCE_MS);

  // Applies a new filter state instantly to the UI and schedules the
  // debounced URL sync. Called only from event handlers (never render).
  const applyNext = (next: Filters) => {
    filtersRef.current = next;
    setFilters(next);
    debouncedPush(next);
  };

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    applyNext({ ...filtersRef.current, [key]: value });
  };

  const toggleArray = (
    key: "locations" | "aptTypes" | "furnishing" | "floorLevel" | "leaseDuration",
    value: string,
  ) => {
    const current = filtersRef.current[key];
    applyNext({
      ...filtersRef.current,
      [key]: current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    });
  };

  // "Search Apartment" applies any pending change immediately.
  const handleApply = () => {
    cancelPush();
    pushFilters(filtersRef.current);
  };

  const handleClear = () => {
    cancelPush();
    filtersRef.current = INITIAL_FILTERS;
    setFilters(INITIAL_FILTERS);
    // Clear All also drops the text search so results are fully unfiltered.
    lastPushedRef.current = "";
    startTransition(() => {
      router.replace("/browse");
    });
  };

  // Stay in sync when the URL changes elsewhere (browser back/forward).
  // Echoes of this panel's own pushes are ignored so in-flight interaction
  // (e.g. a slider drag with a pending debounced push) is never clobbered
  // by a stale URL.
  const paramsSignature = searchParams.toString();
  useEffect(() => {
    if (lastPushedRef.current === paramsSignature) return;
    lastPushedRef.current = paramsSignature;
    const next = readFiltersFromParams(searchParams);
    filtersRef.current = next;
    setFilters(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsSignature]);

  return (
    <div className="bg-surface rounded-xl p-4 border ">
      <div className="flex gap-3 items-center justify-center mb-5">
        {/* Search Button */}
        <Button
          className="w-full"
          onPress={handleApply}
        >
          <Search size={20} />
          Search Apartment
        </Button>

        <Button
          variant="tertiary"
          onPress={handleClear}
        >
          Clear All
        </Button>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-medium">Filters</h3>
        <p className="flex items-center gap-1.5 text-sm text-default-500">
          {isPending ? (
            <Spinner size="sm" color="current" aria-label="Updating results" />
          ) : null}
          {resultCount} results found
        </p>
      </div>

      {/* Verification */}
      <Switch
        isSelected={filters.verifiedOnly}
        onChange={(val) => updateFilter("verifiedOnly", val)}
      >
        <Switch.Content className="flex w-full items-center justify-between">
          <Label>Verified listings only</Label>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch.Content>
      </Switch>

      <Separator className="my-5" />

      {/* Location */}
      <p className="text-sm font-medium mb-2">Location</p>
      <CheckboxGroup
        name="locations"
        value={filters.locations}
        onChange={(val) => updateFilter("locations", val)}
        className="flex flex-col"
      >
        {LOCATIONS.map((option) => (
          <Checkbox key={option} value={option}>
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              {option}
            </Checkbox.Content>
          </Checkbox>
        ))}
      </CheckboxGroup>

      {/* Budget */}
      <div className="flex flex-col gap-2 mt-6">
        <Slider
          minValue={MIN_BUDGET}
          maxValue={MAX_BUDGET}
          step={500}
          value={filters.priceRange}
          onChange={(val) => updateFilter("priceRange", val as [number, number])}
          className="w-full"
        >
          <Label>Budget</Label>

          <Slider.Output>
            {() => {
              const maxDisplay =
                filters.priceRange[1] === MAX_BUDGET
                  ? `₱${MAX_BUDGET.toLocaleString()}+`
                  : `₱${filters.priceRange[1].toLocaleString()}`;

              return `₱${filters.priceRange[0].toLocaleString()} – ${maxDisplay}`;
            }}
          </Slider.Output>

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
        </Slider>
      </div>

      {/* Unit Type */}
      <p className="text-sm font-medium mt-6 mb-2">Unit Type</p>
      <div className="flex flex-wrap gap-2">
        {APARTMENT_TYPES.map((type) => {
          const selected = filters.aptTypes.includes(type);
          return (
            <Chip
              key={type}
              variant={selected ? "primary" : "secondary"}
              color={selected ? "accent" : "default"}
              onClick={() => toggleArray("aptTypes", type)}
              className="cursor-pointer"
            >
              {type}
            </Chip>
          );
        })}
      </div>

      <Separator className="my-5" />

      {/* Sort By */}
      <p className="text-sm font-medium mb-2">Sort By</p>
      <RadioGroup
        name="sort"
        value={filters.sortBy}
        onChange={(val) => updateFilter("sortBy", val)}
      >
        {SORT_OPTIONS.map((opt) => (
          <Radio key={opt.value} value={opt.value}>
            <Radio.Content>
              <Radio.Control>
                <Radio.Indicator />
              </Radio.Control>
              {opt.label}
            </Radio.Content>
          </Radio>
        ))}
      </RadioGroup>

      {/* Bedrooms */}
      <p className="text-sm font-medium mb-2 mt-6">Bedrooms</p>
      <ToggleButtonGroup
        selectionMode="single"
        selectedKeys={filters.bedroom ? new Set([filters.bedroom]) : new Set()}
        onSelectionChange={(keys) => {
          const selected = [...keys][0];
          updateFilter("bedroom", selected ? String(selected) : "Any");
        }}
        fullWidth
        className="w-full"
      >
        {BEDROOM_OPTIONS.map((option, index) => (
          <ToggleButton 
            key={option} 
            id={option} 
            className="flex-1 min-w-0"
          >
            {index !== 0 && <ToggleButtonGroup.Separator />}
            {option}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {/* Bathrooms */}
      <p className="text-sm font-medium mt-6 mb-2">Bathrooms</p>
      <ToggleButtonGroup
        selectionMode="single"
        selectedKeys={filters.bathroom ? new Set([filters.bathroom]) : new Set()}
        onSelectionChange={(keys) => {
          const selected = [...keys][0];
          updateFilter("bathroom", selected ? String(selected) : "Any");
        }}
        fullWidth
        className="w-full"
      >
        {BATHROOM_OPTIONS.map((option, index) => (
          <ToggleButton 
            key={option} 
            id={option} 
            className="flex-1 min-w-0"
          >
            {index !== 0 && <ToggleButtonGroup.Separator />}
            {option}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {/* Size Range */}
      <div className="flex flex-col gap-2 mt-6">
        <Slider
          minValue={MIN_SIZE}
          maxValue={MAX_SIZE}
          step={5}
          value={filters.sizeRange}
          onChange={(val) => updateFilter("sizeRange", val as [number, number])}
          className="w-full"
        >
          <Label>Size Range</Label>

          <Slider.Output>
            {() => `${filters.sizeRange[0]} – ${filters.sizeRange[1]} sqm`}
          </Slider.Output>

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
        </Slider>
      </div>

      <Separator className="my-5" />

      {/* Furnishing */}
      <p className="text-sm font-medium mb-2">Furnishing</p>
      <div className="flex flex-wrap gap-2">
        {FURNISHED_TYPES.map((option) => {
          const selected = filters.furnishing.includes(option);
          return (
            <Chip
              key={option}
              variant={selected ? "primary" : "secondary"}
              color={selected ? "accent" : "default"}
              onClick={() => toggleArray("furnishing", option)}
              className="cursor-pointer"
            >
              {option}
            </Chip>
          );
        })}
      </div>

      {/* Floor Level */}
      <p className="text-sm font-medium mt-6 mb-2">Floor Level</p>
      <div className="flex flex-wrap gap-2">
        {FLOOR_LEVELS.map((option) => {
          const selected = filters.floorLevel.includes(option);
          return (
            <Chip
              key={option}
              variant={selected ? "primary" : "secondary"}
              color={selected ? "accent" : "default"}
              onClick={() => toggleArray("floorLevel", option)}
              className="cursor-pointer"
            >
              {option}
            </Chip>
          );
        })}
      </div>

      {/* Lease Duration */}
      <p className="text-sm font-medium mt-6 mb-2">Lease Duration</p>
      <div className="flex flex-wrap gap-2">
        {LEASE_DURATIONS.map((option) => {
          const selected = filters.leaseDuration.includes(option);
          return (
            <Chip
              key={option}
              variant={selected ? "primary" : "secondary"}
              color={selected ? "accent" : "default"}
              onClick={() => toggleArray("leaseDuration", option)}
              className="cursor-pointer"
            >
              {option}
            </Chip>
          );
        })}
      </div>

      <Separator className="my-5" />

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
