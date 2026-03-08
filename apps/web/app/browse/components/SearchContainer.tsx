"use client";

import { useState } from "react";

import { Select, SelectItem, Button, Selection } from "@heroui/react";
import { MapPin, PhilippinePeso, House, Search, X } from "lucide-react";

const LOCATIONS = ["Caloocan", "Malabon", "Navotas", "Valenzuela"];
const PRICE_RANGES = [
  "₱5,000 - ₱10,000",
  "₱10,000 - ₱15,000",
  "₱15,000 - ₱20,000",
  "₱20,000+",
];
const APARTMENT_TYPES = ["Studio", "1 Bedroom", "2 Bedrooms", "3+ Bedrooms"];

export default function SearchContainer() {
  const [selectedLocations, setSelectedLocations] = useState<Selection>(new Set());
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("");
  const [selectedApartmentTypes, setSelectedApartmentTypes] = useState<Selection>(new Set());

  // Check if any filters are active (either "all" or specific selections)
  const hasActiveFilters = Boolean(
    (selectedLocations === "all" || selectedLocations.size > 0) ||
    selectedPriceRange ||
    (selectedApartmentTypes === "all" || selectedApartmentTypes.size > 0)
  );

  // Clear the filters when the reset button is clicked
  const clearFilters = () => {
    setSelectedLocations(new Set());
    setSelectedPriceRange("");
    setSelectedApartmentTypes(new Set());
  };

  return (
    <div className="w-full h-64 bg-primary rounded-xl flex items-center justify-center flex-col gap-8">
      <h2 className="text-4xl font-medium font-dm-serif text-white">
        Find your Perfect Apartment!
      </h2>

      {/* Search Field */}
      <div className="bg-white rounded-full shadow-sm p-4 md:flex md:gap-3 w-full max-w-4xl">
        {/* Location */}
        <Select
          variant="flat"
          selectionMode="multiple"
          placeholder="Where are you looking?"
          size="lg"
          startContent={<MapPin className="text-primary" />}
          className="md:flex-1 cursor-pointer"
          radius="full"
          selectedKeys={selectedLocations}
          onSelectionChange={setSelectedLocations}
        >
          {LOCATIONS.map((loc) => (
            <SelectItem key={loc} className="data-[hover=true]:bg-light-blue!">
              {loc}
            </SelectItem>
          ))}
        </Select>

        {/* Price Range */}
        <Select
          variant="flat"
          placeholder="Set your budget"
          size="lg"
          className="mt-4 md:flex-1 md:mt-0 cursor-pointer"
          startContent={<PhilippinePeso className="text-primary" />}
          radius="full"
          selectedKeys={selectedPriceRange ? [selectedPriceRange] : []}
          onSelectionChange={(keys) => {
            setSelectedPriceRange(Array.from(keys)[0] as string ?? "");
          }}
        >
          {PRICE_RANGES.map((range) => (
            <SelectItem key={range} className="data-[hover=true]:bg-light-blue!">
              {range}
            </SelectItem>
          ))}
        </Select>

        {/* Apartment Type */}
        <Select
          variant="flat"
          selectionMode="multiple"
          placeholder="Pick a unit size"
          size="lg"
          className="mt-4 md:flex-1 md:mt-0 cursor-pointer"
          startContent={<House className="text-primary" />}
          radius="full"
          selectedKeys={selectedApartmentTypes}
          onSelectionChange={setSelectedApartmentTypes}
        >
          {APARTMENT_TYPES.map((type) => (
            <SelectItem key={type} className="data-[hover=true]:bg-light-blue!">
              {type}
            </SelectItem>
          ))}
        </Select>

        {/* Browse Button */}
        <Button
          className="mt-4 w-full md:w-auto md:mt-0"
          color="primary"
          size="lg"
          radius="full"
          isIconOnly
        >
          <Search />
        </Button>

        {/* Clear/Reset Button */}
        {
          hasActiveFilters && (
            <Button
              className="mt-4 w-full md:w-auto md:mt-0"
              color="primary"
              size="lg"
              radius="full"
              variant="flat"
              isIconOnly
              onPress={clearFilters}
            >
              <X />
            </Button>
          )
        }
      </div>
    </div>
  );
}
