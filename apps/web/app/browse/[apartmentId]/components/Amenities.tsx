"use client";

import { PERKS } from "./perks";

import { Button } from "@heroui/react";

interface AmenitiesProps {
  apartmentPerks: string[];
}

export default function Amenities({ apartmentPerks }: AmenitiesProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">
          Amenities
        </h3>
        
        <Button
          size="sm"
          variant="light"
          radius="full"
          color="primary"
          onPress={() => {
            console.log("SEE ALL AMENITIES");
          }}
        >
          See all amenities
        </Button>
      </div>

      <ul className="grid grid-cols-2 gap-3">
        {apartmentPerks.map((perkId) => {
          const perk = PERKS[perkId];
          if (!perk) return null;
          const Icon = perk.icon;
          return (
            <li key={perk.id} className="flex items-center gap-2">
              <Icon size={20} className="text-primary shrink-0" />
              <span className="text-base">{perk.name}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}