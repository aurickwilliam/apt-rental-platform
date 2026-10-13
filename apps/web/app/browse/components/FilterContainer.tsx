"use client";

import { memo, useCallback, useEffect, useRef, useState, useTransition } from "react";
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
  TextField,
  InputGroup,
} from "@heroui/react";

import { IconSearch } from "@tabler/icons-react";

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
  basePath?: string;
  onApply?: () => void;
};

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

// Min/max keyboard inputs paired with a range slider. The slider UI is
// untouched; both controls write through the same updateFilter path. Drafts
// stay local while typing and commit (step-rounded + clamped) on blur or
// Enter, so partial input is never clobbered. Out-of-range sides clamp
// silently against the opposite side (min clamps to max and vice versa).
function RangeInputs({
  min,
  max,
  absoluteMin,
  absoluteMax,
  step,
  prefix,
  suffix,
  minLabel,
  maxLabel,
  onCommit,
}: {
  min: number;
  max: number;
  absoluteMin: number;
  absoluteMax: number;
  step: number;
  prefix?: string;
  suffix?: string;
  minLabel: string;
  maxLabel: string;
  onCommit: (next: [number, number]) => void;
}) {
  const [draftMin, setDraftMin] = useState<string | null>(null);
  const [draftMax, setDraftMax] = useState<string | null>(null);

  // External changes (slider drag, Clear All, back/forward) reset drafts so
  // the inputs always reflect the committed range when not being edited.
  // Compared during render (not in an effect); our own commits land here
  // too and simply clear already-applied drafts.
  const [prevRange, setPrevRange] = useState<[number, number]>([min, max]);
  if (prevRange[0] !== min || prevRange[1] !== max) {
    setPrevRange([min, max]);
    setDraftMin(null);
    setDraftMax(null);
  }

  const parse = (raw: string, fallback: number) => {
    const digits = raw.replace(/[^0-9]/g, "");
    if (!digits) return fallback;
    return Math.round(Number(digits) / step) * step;
  };

  const commitSide = (side: "min" | "max") => {
    if (side === "min") {
      if (draftMin === null) return;
      const nextMin = Math.min(Math.max(parse(draftMin, min), absoluteMin), max);
      setDraftMin(null);
      if (nextMin !== min) onCommit([nextMin, max]);
    } else {
      if (draftMax === null) return;
      const nextMax = Math.max(Math.min(parse(draftMax, max), absoluteMax), min);
      setDraftMax(null);
      if (nextMax !== max) onCommit([min, nextMax]);
    }
  };

  // Plain render helper (not a component) so focus is never lost while typing.
  const field = (
    side: "min" | "max",
    draft: string | null,
    committed: number,
    bound: number,
    label: string,
    affix: string | undefined,
    affixSlot: "prefix" | "suffix",
  ) => (
    <TextField
      value={draft ?? String(committed)}
      onChange={(v) => (side === "min" ? setDraftMin(v) : setDraftMax(v))}
      aria-label={label}
      className="min-w-0 flex-1"
    >
      <Label className="mb-1 text-xs text-muted-foreground">
        {side === "min" ? "Min" : "Max"}
      </Label>
      <InputGroup className="rounded-lg border border-gray-300 bg-white transition-all focus-within:border-[#376BF5] focus-within:ring-2 focus-within:ring-[#376BF5]/15 [&_input::placeholder]:text-gray-400">
        {affix && affixSlot === "prefix" ? (
          <InputGroup.Prefix>
            <span className="text-sm text-muted-foreground">{affix}</span>
          </InputGroup.Prefix>
        ) : null}
        <InputGroup.Input
          inputMode="numeric"
          placeholder={String(bound)}
          onBlur={() => commitSide(side)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitSide(side);
          }}
          className="w-full min-w-0 py-1.5 text-sm"
        />
        {affix && affixSlot === "suffix" ? (
          <InputGroup.Suffix>
            <span className="text-xs text-muted-foreground">{affix}</span>
          </InputGroup.Suffix>
        ) : null}
      </InputGroup>
    </TextField>
  );

  return (
    <div className="flex gap-2">
      {field("min", draftMin, min, absoluteMin, minLabel, prefix, "prefix")}
      {field("max", draftMax, max, absoluteMax, maxLabel, suffix, "suffix")}
    </div>
  );
}

// Slider sections are memoized so high-frequency slider drags redraw only
// the dragged section instead of the whole ~30-control panel. Inline
// handlers live inside, where they can't break the memo; parents pass
// stable range values plus a stable commit callback.
const BudgetSection = memo(function BudgetSection({
  priceRange,
  onPriceChange,
}: {
  priceRange: [number, number];
  onPriceChange: (next: [number, number]) => void;
}) {
  return (
    <div className="flex flex-col gap-2 mt-6">
      <Slider
        minValue={MIN_BUDGET}
        maxValue={MAX_BUDGET}
        step={500}
        value={priceRange}
        onChange={(val) => onPriceChange(val as [number, number])}
        className="w-full [&_[data-slot=slider-thumb]]:bg-primary [&_[data-slot=slider-thumb]::after]:bg-white [&_[data-slot=slider-track][data-fill-start=true]]:border-s-primary [&_[data-slot=slider-track][data-fill-end=true]]:border-e-primary"
      >
        <Label>Budget</Label>

        <Slider.Output>
          {() => {
            const maxDisplay =
              priceRange[1] === MAX_BUDGET
                ? `₱${MAX_BUDGET.toLocaleString()}+`
                : `₱${priceRange[1].toLocaleString()}`;

            return `₱${priceRange[0].toLocaleString()} – ${maxDisplay}`;
          }}
        </Slider.Output>

        <Slider.Track>
          {({ state }) => (
            <>
              <Slider.Fill className="bg-primary" />
              {state.values.map((_, i) => (
                <Slider.Thumb key={i} index={i} />
              ))}
            </>
          )}
        </Slider.Track>
      </Slider>
      <RangeInputs
        min={priceRange[0]}
        max={priceRange[1]}
        absoluteMin={MIN_BUDGET}
        absoluteMax={MAX_BUDGET}
        step={500}
        prefix="₱"
        minLabel="Minimum budget"
        maxLabel="Maximum budget"
        onCommit={onPriceChange}
      />
    </div>
  );
});

const SizeSection = memo(function SizeSection({
  sizeRange,
  onSizeChange,
}: {
  sizeRange: [number, number];
  onSizeChange: (next: [number, number]) => void;
}) {
  return (
    <div className="flex flex-col gap-2 mt-6">
      <Slider
        minValue={MIN_SIZE}
        maxValue={MAX_SIZE}
        step={5}
        value={sizeRange}
        onChange={(val) => onSizeChange(val as [number, number])}
        className="w-full [&_[data-slot=slider-thumb]]:bg-primary [&_[data-slot=slider-thumb]::after]:bg-white [&_[data-slot=slider-track][data-fill-start=true]]:border-s-primary [&_[data-slot=slider-track][data-fill-end=true]]:border-e-primary"
      >
        <Label>Size Range</Label>

        <Slider.Output>
          {() => `${sizeRange[0]} – ${sizeRange[1]} sqm`}
        </Slider.Output>

        <Slider.Track>
          {({ state }) => (
            <>
              <Slider.Fill className="bg-primary" />
              {state.values.map((_, i) => (
                <Slider.Thumb key={i} index={i} />
              ))}
            </>
          )}
        </Slider.Track>
      </Slider>
      <RangeInputs
        min={sizeRange[0]}
        max={sizeRange[1]}
        absoluteMin={MIN_SIZE}
        absoluteMax={MAX_SIZE}
        step={5}
        suffix="sqm"
        minLabel="Minimum size"
        maxLabel="Maximum size"
        onCommit={onSizeChange}
      />
    </div>
  );
});

export default function FilterContainer({ resultCount, basePath = "/browse", onApply }: Props)
{
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
  // ignores echoes of our own pushes, so local edits made after an apply
  // are never clobbered by a stale URL.
  const lastPushedRef = useRef<string | null>(null);

  const pushFilters = useCallback(
    (next: Filters) => {
      const query = serializeFilters(next, searchParamsRef.current.get("search"));
      lastPushedRef.current = query;
      startTransition(() => {
        router.replace(query ? `${basePath}?${query}` : basePath);
      });
    },
    [basePath, router],
  );

  // Applies a new filter state instantly to the UI only — no fetching.
  // The URL (and therefore results) updates solely via "Search Apartment"
  // or "Clear All". Called only from event handlers (never render).
  // Stable so memoized sections skip unrelated updates.
  const applyNext = useCallback((next: Filters) => {
    filtersRef.current = next;
    setFilters(next);
  }, []);

  const updateFilter = useCallback(
    <K extends keyof Filters>(key: K, value: Filters[K]) => {
      applyNext({ ...filtersRef.current, [key]: value });
    },
    [applyNext],
  );

  const toggleArray = useCallback(
    (
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
    },
    [applyNext],
  );

  // Stable range commits for the memoized slider sections.
  const handlePriceChange = useCallback(
    (next: [number, number]) => updateFilter("priceRange", next),
    [updateFilter],
  );
  const handleSizeChange = useCallback(
    (next: [number, number]) => updateFilter("sizeRange", next),
    [updateFilter],
  );

  // "Search Apartment" is the single fetch trigger for filter edits.
  const handleApply = useCallback(() => {
    pushFilters(filtersRef.current);
    onApply?.();
  }, [onApply, pushFilters]);

  const handleClear = useCallback(() => {
    filtersRef.current = INITIAL_FILTERS;
    setFilters(INITIAL_FILTERS);
    // Clear All also drops the text search so results are fully unfiltered.
    lastPushedRef.current = "";
    startTransition(() => {
      router.replace(basePath);
    });
  }, [basePath, router]);

  // Stay in sync when the URL changes elsewhere (browser back/forward,
  // text search). Echoes of this panel's own pushes are ignored so local
  // edits made after an apply are never clobbered by a stale URL.
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
    <div className="bg-surface rounded-xl p-4 border w-full text-foreground">
      <div className="flex flex-col xl:flex-row gap-2 xl:gap-3 items-stretch xl:items-center justify-center mb-5">
        {/* Search Button */}
        <Button
          className="w-full"
          onPress={handleApply}
        >
          <IconSearch size={20} />
          Search Apartment
        </Button>

        <Button
          variant="tertiary"
          className="w-full xl:w-auto shrink-0"
          onPress={handleClear}
        >
          Clear All
        </Button>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-medium">Filters</h3>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
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
      <BudgetSection priceRange={filters.priceRange} onPriceChange={handlePriceChange} />

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
      <SizeSection sizeRange={filters.sizeRange} onSizeChange={handleSizeChange} />

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
