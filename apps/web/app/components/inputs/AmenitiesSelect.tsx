"use client";

import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent, Input, Checkbox, Button, Chip } from "@heroui/react";
import { ChevronDown, Search } from "lucide-react";

import { Perk } from "./perks"

type Props = {
  amenities: Perk[];
  selected: string[];
  onChange: (val: string[]) => void;
};

export default function AmenitiesSelect({ amenities, selected, onChange }: Props) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = amenities.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    onChange(
      selected.includes(id)
        ? selected.filter((a) => a !== id)
        : [...selected, id]
    );
  };

  const getLabel = (id: string) => amenities.find(a => a.id === id)?.name ?? id;

  return (
    <div className="flex flex-col gap-2">
      {/* Trigger */}
      <Button
        variant="bordered"
        radius="full"
        size="sm"
        className="w-full justify-between"
        endContent={<ChevronDown size={14} />}
        onPress={() => setIsOpen((prev) => !prev)}
      >
        {selected.length > 0 ? `${selected.length} selected` : "Select amenities"}
      </Button>

      {/* Inline dropdown */}
      {isOpen && (
        <div className="border border-default-200 rounded-xl p-3 flex flex-col gap-2 bg-white">
          <Input
            placeholder="Search amenities..."
            size="sm"
            radius="full"
            startContent={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto overflow-x-hidden mt-1 w-full pr-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-default-400 text-center py-2">No results</p>
            ) : (
              filtered.map((perk) => (
                <Checkbox
                  key={perk.id}
                  size="sm"
                  className="w-full"
                  isSelected={selected.includes(perk.id)}
                  onValueChange={() => toggle(perk.id)}
                >
                  {perk.name}
                </Checkbox>
              ))
            )}
          </div>
        </div>
      )}

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((id) => (
            <Chip
              key={id}
              size="sm"
              variant="flat"
              color="primary"
              onClose={() => toggle(id)}
            >
              {getLabel(id)}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}
