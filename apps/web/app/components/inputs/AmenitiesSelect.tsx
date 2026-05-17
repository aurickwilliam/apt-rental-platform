"use client";

import { useState } from "react";
import { Checkbox, Button, Chip, InputGroup, Label, CloseButton } from "@heroui/react";
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
        variant="outline"
        size="sm"
        className="w-full justify-between"
        onPress={() => setIsOpen((prev) => !prev)}
      >
        {selected.length > 0 ? `${selected.length} selected` : "Select amenities"}

        <ChevronDown size={14} />
      </Button>

      {/* Inline dropdown */}
      {isOpen && (
        <div className="border border-default-200 rounded-xl p-3 flex flex-col gap-2 bg-white">
          <InputGroup className="rounded-xl border border-gray-300 bg-white transition-all focus-within:border-[#376BF5] focus-within:ring-2 focus-within:ring-[#376BF5]/15 [&_input::placeholder]:text-gray-400">
            <InputGroup.Input
              placeholder="Search amenities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <InputGroup.Suffix>
              <Search size={14} className="text-grey-500" />
            </InputGroup.Suffix>
          </InputGroup>
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto overflow-x-hidden mt-1 w-full pr-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-default-400 text-center py-2">No results</p>
            ) : (
              filtered.map((perk) => (
                <Checkbox
                  key={perk.id}
                  className="w-full"
                  isSelected={selected.includes(perk.id)}
                  onChange={() => toggle(perk.id)}
                >
                  <Checkbox.Control className="shadow-none border-2">
                    <Checkbox.Indicator />
                  </Checkbox.Control>

                  <Checkbox.Content>
                    <Label>{perk.name}</Label>
                  </Checkbox.Content>
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
              variant="soft"
              className="pl-2 py-1 gap-1"
            >
              {getLabel(id)}
              <CloseButton 
                className="bg-white text-black"
                onPress={() => toggle(id)}
              />
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}
