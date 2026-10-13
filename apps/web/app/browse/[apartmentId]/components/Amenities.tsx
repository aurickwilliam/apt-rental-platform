"use client";

import { PERKS } from "../../../components/inputs/perks";

// import { Button } from "@heroui/react";

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

        {/* <Button
          size="sm"
          variant="light"
          radius="full"
          color="secondary"
          className="-mr-3"
          onPress={() => {
            alert("SEE ALL AMENITIES");
          }}
        >
          See all amenities
        </Button> */}
      </div>

      <ul className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3 min-w-0">
        {apartmentPerks.map((perkId) => {
          const perk = PERKS[perkId];
          if (!perk) return null;
          const Icon = perk.icon;
          return (
            <li key={perk.id} className="flex items-center gap-2 min-w-0">
              <Icon size={20} className="text-primary shrink-0" />
              <span className="text-sm sm:text-base break-words">{perk.name}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
