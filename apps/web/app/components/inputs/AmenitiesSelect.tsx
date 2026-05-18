"use client";

import { useState } from "react";

import {
  Popover,
  Checkbox,
  Button,
  Chip,
  InputGroup,
  Label,
} from "@heroui/react";

import { ChevronDown, Search, X } from "lucide-react";

import { Perk } from "./perks";

type Props = {
  amenities: Perk[];
  selected: string[];
  onChange: (val: string[]) => void;
};

export default function AmenitiesSelect({ amenities, selected, onChange }: Props) {
  const [search, setSearch] = useState("");

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

  const getLabel = (id: string) => amenities.find((a) => a.id === id)?.name ?? id;

  return (
    <div className="flex flex-col gap-2">
      <Popover onOpenChange={() => setSearch("")}>
        <Popover.Trigger>
          <Button variant="outline" size="sm" className="w-full justify-between">
            {selected.length > 0 ? `${selected.length} selected` : "Select amenities"}
            <ChevronDown size={14} />
          </Button>
        </Popover.Trigger>

        <Popover.Content
          placement="bottom"
          className="w-(--trigger-width) p-0"
        >
          <Popover.Dialog className="flex flex-col gap-2 p-3">
            <InputGroup className="rounded-xl border border-gray-300 bg-white transition-all focus-within:border-[#376BF5] focus-within:ring-2 focus-within:ring-[#376BF5]/15 [&_input::placeholder]:text-gray-400">
              <InputGroup.Input
                autoFocus
                placeholder="Search amenities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <InputGroup.Suffix>
                <Search size={14} className="text-grey-500" />
              </InputGroup.Suffix>
            </InputGroup>

            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto overflow-x-hidden w-full pr-1">
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
          </Popover.Dialog>
        </Popover.Content>
      </Popover>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((id) => (
            <Chip
              key={id}
              size="sm"
              variant="soft"
              className="pl-2.5 pr-1 py-1 gap-1 bg-blue-50 text-blue-600 border border-blue-100"
            >
              {getLabel(id)}
              <button
                type="button"
                onClick={() => toggle(id)}
                className="cursor-pointer flex items-center justify-center size-3.5 rounded-full bg-blue-100 text-blue-500 hover:bg-blue-200 hover:text-blue-700 transition-colors"
              >
                <X size={9} strokeWidth={2.5} />
              </button>
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}