"use client";

import { MapPin, Coins, Home, User, Bed, Users, ParkingCircle, PawPrint, Cigarette, Accessibility, Car, Truck, Bike } from "lucide-react";
import { Button, Input, Label, Spinner, TextField } from "@heroui/react";
import { toast } from "@heroui/react";
import { useRentalPreferencesForm, BEDROOM_OPTIONS, FAMILY_OPTIONS, PARKING_SPOT_OPTIONS } from "../hooks/use-rental-preferences";
import { CAMANAVA_FILTER_OPTIONS, PETS, VEHICLE_OPTIONS } from "@repo/constants";
import ToggleSwitch from "../components/ToggleSwitch";
import SettingsShell from "../components/SettingsShell";
import SectionTitle from "../components/SectionTitle";
import { formatPesoDisplay } from "@repo/utils";
import { MultiSelectPopover } from "../components/MultiSelectPopover";
import { SingleSelectPopover } from "../components/SingleSelectPopover";
import { RangeSlider } from "../components/RangeSlider";

const vehicleIconMap: Record<string, React.ReactNode> = {
  Car: <Car className="w-4 h-4" />,
  Motorcycle: <Bike className="w-4 h-4" />,
  Bicycle: <Bike className="w-4 h-4" />,
  Other: <Truck className="w-4 h-4" />,
};

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
    reset,
  } = useRentalPreferencesForm();

  const allCities = CAMANAVA_FILTER_OPTIONS.slice(1);

  const handleCityToggle = (city: string) => {
    if (city === "CAMANAVA") {
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
      return;
    }
    toggleCity(city);
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

  const handleReset = () => {
    reset();
  };

  if (!profile) {
    return (
      <SettingsShell title="Rental Preferences" showBack>
        <div className="flex items-center justify-center h-64">
          <Spinner color="accent" aria-label="Loading preferences" />
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
              onToggle={handleCityToggle}
              options={CAMANAVA_FILTER_OPTIONS}
              placeholder="All CAMANAVA"
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

            <RangeSlider
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
                    onChange={(v) => {
                      const next = Number(v);
                      if (Number.isFinite(next)) setNoOfParkingSpots(next);
                    }}
                    options={[...PARKING_SPOT_OPTIONS]}
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

        {/* Save / Reset */}
        {isDirty && (
          <div className="pt-2 space-y-3 border-t">
            <div className="flex gap-3">
              <Button onPress={handleSave} isDisabled={isSaving} className="flex-1">
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
              <Button variant="outline" onPress={handleReset} className="flex-1">
                Discard changes
              </Button>
            </div>
            <p className="text-muted-foreground text-xs font-inter text-center">
              Changes personalize your search instantly after saving.
            </p>
          </div>
        )}

      </div>
    </SettingsShell>
  );
}