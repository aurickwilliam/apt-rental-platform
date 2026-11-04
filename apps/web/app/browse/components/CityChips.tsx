"use client";

import { Button } from "@heroui/react";
import { CAMANAVA_CITIES } from "@repo/constants";

import { BROWSE_CITY_CHIPS_CLASS } from "../lib/browse-layout";

interface CityChipsProps {
  /** The one city the `locations` filter holds, or null for all cities. */
  selected: string | null;
  /** True when the filter holds several cities or one outside CAMANAVA: no chip is current. */
  isCustom: boolean;
  onSelect: (city: string | null) => void;
}

/**
 * Quick city filter under the search bar: "All cities" plus the four CAMANAVA
 * cities, one at a time. It writes the same `locations` filter as the drawer.
 */
export default function CityChips({ selected, isCustom, onSelect }: CityChipsProps) {
  const chips: { label: string; city: string | null }[] = [
    { label: "All cities", city: null },
    ...CAMANAVA_CITIES.map((city) => ({ label: city, city })),
  ];

  return (
    <div role="group" aria-label="Filter by city" className={BROWSE_CITY_CHIPS_CLASS}>
      {chips.map(({ label, city }) => {
        const isActive = !isCustom && selected === city;
        return (
          <Button
            key={label}
            size="sm"
            variant={isActive ? "primary" : "outline"}
            aria-pressed={isActive}
            className="shrink-0 cursor-pointer rounded-full"
            onPress={() => onSelect(city)}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
