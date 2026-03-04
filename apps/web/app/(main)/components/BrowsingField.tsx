"use client"

import { Select, SelectItem, Button } from "@heroui/react"

import {
  MapPin,
  PhilippinePeso,
  House,
  Search,
} from "lucide-react"

export default function BrowsingField() {

  const LOCATIONS = [
    "Caloocan",
    "Malabon",
    "Navotas",
    "Valenzuela",
  ]

  const PRICE_RANGES = [
    "₱5,000 - ₱10,000",
    "₱10,000 - ₱15,000",
    "₱15,000 - ₱20,000",
    "₱20,000+",
  ]

  const APARTMENT_TYPES = [
    "Studio",
    "1 Bedroom",
    "2 Bedrooms",
    "3+ Bedrooms",
  ]

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Location */}
      <Select 
        variant="flat"
        selectionMode="multiple"
        placeholder="Select a Location"
        size="lg"
        startContent={<MapPin className="text-primary" />}
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
        selectionMode="multiple"
        placeholder="Select a Price Range"
        size="lg"
        className="mt-4"
        startContent={<PhilippinePeso className="text-primary" />}
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
        placeholder="Select an Apartment Type"
        size="lg"
        className="mt-4"
        startContent={<House className="text-primary" />}
      >
        {APARTMENT_TYPES.map((type) => (
          <SelectItem key={type} className="data-[hover=true]:bg-light-blue!">
            {type}
          </SelectItem>
        ))}
      </Select>

      {/* Browse Button */}
      <Button 
        className="mt-4 w-full"
        color="primary"
        startContent={<Search />}
      >
        Find Now
      </Button>
    </div>
  )
}