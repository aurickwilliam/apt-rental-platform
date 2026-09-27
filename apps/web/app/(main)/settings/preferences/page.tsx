"use client";

import { useState } from "react";
import { MapPin, Coins, Home, User, Bed, Users, ParkingCircle, PawPrint, Cigarette, Accessibility, Car, Truck, Bike, ChevronDown } from "lucide-react";
import { Button, Input, Label, Slider, TextField, Popover, ListBox, Checkbox } from "@heroui/react";
import { toast } from "@heroui/react";
import { useRentalPreferencesForm } from "../hooks/use-rental-preferences";
import { CAMANAVA_CITIES, PETS, VEHICLE_OPTIONS } from "@repo/constants";
import ToggleSwitch from "../components/ToggleSwitch";
import SettingsShell from "../components/SettingsShell";
import SectionTitle from "../components/SectionTitle";
import { formatPesoDisplay } from "@repo/utils";

const BEDROOM_OPTIONS = ["1-2 Bedrooms", "2-4 Bedrooms", "4+ Bedrooms"] as const;
const FAMILY_OPTIONS = ["Single", "Family of 2", "3 - 4 Persons", "5 - 6 Persons", "7+ Persons"] as const;
const NO_PARKING_OPTIONS = ["1", "2", "3", "4", "5"] as const;

const vehicleIconMap: Record<string, React.ReactNode> = {
  Car: <Car className="w-4 h-4" />,
  Motorcycle: <Bike className="w-4 h-4" />,
  Bicycle: <Bike className="w-4 h-4" />,
  Other: <Truck className="w-4 h-4" />,
};

function MultiSelectPopover({
  value,
  onChange,
  options,
  placeholder,
  renderItem,
  includeAllOption,
  allOptionLabel,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  options: string[];
  placeholder?: string;
  renderItem?: (option: string) => React.ReactNode;
  includeAllOption?: boolean;
  allOptionLabel?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (option: string) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  const handleAllToggle = () => {
    if (value.length === options.length) {
      onChange([]);
    } else {
      onChange(options);
    }
  };

  const isAllSelected = options.length > 0 && options.every((opt) => value.includes(opt));

  const displayValue = value.length === 0
    ? placeholder
    : value.length === 1 && includeAllOption && value[0] === allOptionLabel
      ? allOptionLabel
      : value.join(", ");

  return (
    <Popover onOpenChange={setIsOpen}>
      <Popover.Trigger>
        <Button
          variant="outline"
          className="w-full justify-between px-4 py-3 h-auto"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="text-left flex-1 font-inter text-sm text-foreground truncate">
            {displayValue}
          </span>
          <ChevronDown size={14} className="flex-shrink-0" />
        </Button>
      </Popover.Trigger>

      <Popover.Content placement="bottom" className="w-(--trigger-width) p-0">
        <Popover.Dialog className="flex flex-col gap-2 p-3 bg-popover border border-border rounded-xl shadow-lg">
          <div className="relative rounded-xl border border-border bg-popover">
            <Input
              autoFocus
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent placeholder:text-muted-foreground pl-10 pr-4 py-3"
            />
            <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          </div>

          <div className="flex flex-col gap-1 max-h-60 overflow-y-auto overflow-x-hidden w-full pr-1">
            {includeAllOption && (
              <label className="flex items-center gap-2 px-4 py-3 hover:bg-primary/5 rounded-lg cursor-pointer">
                <Checkbox
                  isSelected={isAllSelected}
                  onChange={handleAllToggle}
                  className="w-4 h-4 text-primary"
                />
                <span className="font-inter text-sm font-medium">{allOptionLabel}</span>
              </label>
            )}
            {filtered.map((option) => (
              <label key={option} className="flex items-center gap-2 px-4 py-3 hover:bg-primary/5 rounded-lg cursor-pointer">
                <Checkbox
                  isSelected={value.includes(option)}
                  onChange={() => toggleOption(option)}
                  className="w-4 h-4 text-primary"
                />
                {renderItem ? renderItem(option) : <span className="font-inter text-sm">{option}</span>}
              </label>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">No results</p>
            )}
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

function SingleSelectPopover({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <Popover>
      <Popover.Trigger>
        <Button
          variant="outline"
          className="w-full justify-between px-4 py-3 h-auto"
        >
          <span className="text-left flex-1 font-inter text-sm text-foreground truncate">
            {value || placeholder || "Select"}
          </span>
          <ChevronDown size={14} className="flex-shrink-0" />
        </Button>
      </Popover.Trigger>
      <Popover.Content placement="bottom" className="w-(--trigger-width) p-0">
        <Popover.Dialog className="p-2 bg-popover border border-border rounded-xl shadow-lg max-h-60 overflow-auto">
          <ListBox selectionMode="single" selectedKeys={[value]} onSelectionChange={(keys) => onChange(Array.from(keys)[0] as string)}>
            {options.map((opt) => (
              <ListBox.Item key={opt} value={opt}>
                {opt}
              </ListBox.Item>
            ))}
          </ListBox>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

function RangeSliderComponent({
  value,
  onChange,
  min,
  max,
  step,
  className,
}: {
  value: [number, number];
  onChange: (value: number | number[]) => void;
  min: number;
  max: number;
  step: number;
  className?: string;
}) {
  return (
    <Slider
      minValue={min}
      maxValue={max}
      step={step}
      value={value}
      onChange={onChange}
      className={className}
    >
      <Label>Budget</Label>
      <Slider.Output>
        {() => {
          const maxDisplay =
            value[1] === max
              ? `${formatPesoDisplay(max)}+`
              : formatPesoDisplay(value[1]);
          return `${formatPesoDisplay(value[0])} – ${maxDisplay}`;
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
  );
}

export default function RentalPreferencesPage() {
  const {
    profile,
    isTenant,
    selectedCities,
    budgetMin,
    budgetMax,
    bedroomCount,
    householdSize,
    hasPets,
    kindOfPets,
    nameOfPets,
    hasParking,
    noOfParkingSpots,
    listOfVehicles,
    hasSmoker,
    hasDisability,
    isSaving,
    isDirty,
    setBudgetRange,
    setBedroomCount,
    setHouseholdSize,
    setHasPets,
    setKindOfPets,
    setNameOfPets,
    setHasParking,
    setNoOfParkingSpots,
    setHasSmoker,
    setHasDisability,
    toggleCity,
    toggleVehicle,
    save,
  } = useRentalPreferencesForm();

  const cities = ["CAMANAVA", ...CAMANAVA_CITIES];
  const allCities = cities.slice(1);

  const handleCitiesChange = (newCities: string[]) => {
    if (newCities.includes("CAMANAVA")) {
      const allSelected = allCities.every((c) => selectedCities.includes(c));
      if (allSelected) {
        allCities.forEach((c) => {
          if (selectedCities.includes(c)) toggleCity(c);
        });
      } else {
        allCities.forEach((c) => {
          if (!selectedCities.includes(c)) toggleCity(c);
        });
      }
    } else {
      // Find added/removed cities
      const removed = selectedCities.filter((c) => !newCities.includes(c));
      const added = newCities.filter((c) => !selectedCities.includes(c));
      removed.forEach((c) => toggleCity(c));
      added.forEach((c) => toggleCity(c));
    }
  };

  const cityValues = (() => {
    const allSelected = allCities.length > 0 && allCities.every((c) => selectedCities.includes(c));
    if (allSelected && selectedCities.length === allCities.length) return ["CAMANAVA"];
    return selectedCities;
  })();

  const handleVehiclesChange = (newVehicles: string[]) => {
    const removed = listOfVehicles.filter((v) => !newVehicles.includes(v));
    const added = newVehicles.filter((v) => !listOfVehicles.includes(v));
    removed.forEach((v) => toggleVehicle(v));
    added.forEach((v) => toggleVehicle(v));
  };

  const handleBudgetChange = (val: number | number[]) => {
    const [min, max] = val as [number, number];
    setBudgetRange(min, max);
  };

  const handleSave = async () => {
    if (!profile?.id) {
      toast.danger("Not signed in");
      return;
    }
    await save();
  };

  if (!profile) {
    return (
      <SettingsShell title="Rental Preferences" showBack>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </SettingsShell>
    );
  }

  if (!isTenant) {
    return (
      <SettingsShell title="Rental Preferences" showBack>
        <div className="p-4 sm:p-5 text-center py-16">
          <p className="text-muted-foreground">Rental preferences are only available for tenant accounts.</p>
        </div>
      </SettingsShell>
    );
  }

  return (
    <SettingsShell title="Rental Preferences" subtitle="Personalize your search and matching" showBack>
      <div className="p-4 sm:p-5 space-y-6 divide-y divide-border">
        {/* Location */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-primary" />
            <SectionTitle title="Location" />
          </div>
          <div className="space-y-3">
            <Label className="font-inter text-sm font-semibold text-foreground">Preferred cities</Label>
            <p className="font-inter text-sm text-muted-foreground">Select all cities you&apos;re interested in</p>
            <MultiSelectPopover
              value={cityValues}
              onChange={handleCitiesChange}
              options={cities}
              placeholder="All CAMANAVA"
              includeAllOption
              allOptionLabel="CAMANAVA (All)"
              renderItem={(city) => city === "CAMANAVA" ? <span className="font-medium">{city}</span> : city}
            />
          </div>
        </div>

        {/* Budget */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Coins className="w-5 h-5 text-primary" />
            <SectionTitle title="Budget" />
          </div>
          <div className="space-y-3">
            <Label className="font-inter text-sm font-semibold text-foreground">Monthly budget</Label>
            <p className="font-inter text-sm text-muted-foreground">Used to rank listings. Max stays ₱100,000.</p>

            <div className="text-center py-4">
              <p className="text-primary text-2xl font-nunito font-bold">
                {formatPesoDisplay(budgetMin)} — {formatPesoDisplay(budgetMax)}
              </p>
            </div>

            <RangeSliderComponent
              value={[budgetMin, budgetMax]}
              onChange={handleBudgetChange}
              min={5_000}
              max={100_000}
              step={1_000}
              className="w-full"
            />

            <div className="flex justify-between font-inter text-xs text-muted-foreground">
              <span>{formatPesoDisplay(5_000)}</span>
              <span>{formatPesoDisplay(100_000)}</span>
            </div>
          </div>
        </div>

        {/* Home */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Home className="w-5 h-5 text-primary" />
            <SectionTitle title="Home" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Bed className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-inter text-sm text-foreground">Bedrooms</p>
                </div>
              </div>
              <SingleSelectPopover
                value={bedroomCount ?? ""}
                onChange={setBedroomCount}
                options={[...BEDROOM_OPTIONS]}
                placeholder="Select bedrooms"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-inter text-sm text-foreground">Household size</p>
                </div>
              </div>
              <SingleSelectPopover
                value={householdSize ?? ""}
                onChange={setHouseholdSize}
                options={[...FAMILY_OPTIONS]}
                placeholder="Select household size"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <ParkingCircle className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-inter text-sm text-foreground">Need parking?</p>
                </div>
              </div>
              <ToggleSwitch
                isSelected={hasParking}
                onValueChange={setHasParking}
              />
            </div>

            {hasParking && (
              <>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10" />
                    <div>
                      <p className="font-inter text-sm text-foreground">Parking spots</p>
                    </div>
                  </div>
                  <SingleSelectPopover
                    value={String(noOfParkingSpots)}
                    onChange={(v) => setNoOfParkingSpots(Number(v))}
                    options={[...NO_PARKING_OPTIONS]}
                    placeholder="Select spots"
                  />
                </div>

                <div className="space-y-3 pt-3">
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-inter text-sm text-foreground">Vehicles</p>
                      <p className="font-inter text-xs text-muted-foreground">Multi-select</p>
                    </div>
                  </div>
                  <MultiSelectPopover
                    value={listOfVehicles}
                    onChange={handleVehiclesChange}
                    options={VEHICLE_OPTIONS}
                    placeholder="Select vehicles"
                    renderItem={(vehicle) => (
                      <span className="flex items-center gap-2">
                        {vehicleIconMap[vehicle] || <Car className="w-4 h-4" />}
                        {vehicle}
                      </span>
                    )}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Lifestyle */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-primary" />
            <SectionTitle title="Lifestyle" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <PawPrint className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-inter text-sm text-foreground">Have pets?</p>
                </div>
              </div>
              <ToggleSwitch
                isSelected={hasPets}
                onValueChange={setHasPets}
              />
            </div>

            {hasPets && (
              <>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10" />
                    <div>
                      <p className="font-inter text-sm text-foreground">What kind of pet?</p>
                    </div>
                  </div>
                  <SingleSelectPopover
                    value={kindOfPets ?? ""}
                    onChange={setKindOfPets}
                    options={PETS}
                    placeholder="Select pet kind"
                  />
                </div>

                {kindOfPets === "Other" && (
                  <div className="pt-3">
                    <TextField isRequired>
                      <Label className="font-inter text-sm text-foreground">Please specify</Label>
                      <Input
                        placeholder="Type kind"
                        value={nameOfPets ?? ""}
                        onChange={(e) => setNameOfPets(e.target.value)}
                      />
                    </TextField>
                    <p className="font-inter text-xs text-muted-foreground mt-1">e.g., Poodle, Siamese</p>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Cigarette className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-inter text-sm text-foreground">Anyone a smoker?</p>
                  <p className="font-inter text-xs text-muted-foreground">Helps match non-smoking listings</p>
                </div>
              </div>
              <ToggleSwitch
                isSelected={hasSmoker}
                onValueChange={setHasSmoker}
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Accessibility className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-inter text-sm text-foreground">Accessibility needs?</p>
                  <p className="font-inter text-xs text-muted-foreground">Prioritize wheelchair-friendly</p>
                </div>
              </div>
              <ToggleSwitch
                isSelected={hasDisability}
                onValueChange={setHasDisability}
              />
            </div>
          </div>
        </div>

        {/* Save */}
        {isDirty && (
          <div className="pt-2 space-y-3 border-t">
            <Button onPress={handleSave} isDisabled={isSaving}>
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
            <p className="text-muted-foreground text-xs font-inter text-center">
              Changes personalize your search instantly after saving.
            </p>
          </div>
        )}

      </div>
    </SettingsShell>
  );
}