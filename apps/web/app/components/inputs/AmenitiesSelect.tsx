"use client";

import { useState } from "react";

import {
  Popover,
  Checkbox,
  Button,
  Chip,
  InputGroup,
} from "@heroui/react";

import { IconChevronDown as ChevronDown, IconSearch as Search, IconX as X } from "@tabler/icons-react";

import { isRetiredAmenity, toggleAmenitySelection } from "@repo/constants";
import { AMENITY_KEYS, enumLabel } from "@repo/i18n";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";

import { Perk } from "./perks";

type Props = {
  amenities: Perk[];
  selected: string[];
  onChange: (val: string[]) => void;
};

export default function AmenitiesSelect({ amenities, selected, onChange }: Props) {
  const { language, t } = useTranslation();
  const [search, setSearch] = useState("");
  const labelOf = (perk: Perk) => enumLabel(language, AMENITY_KEYS, perk.id);

  const filtered = amenities.filter(
    (a) =>
      // Retired perks (e.g. Furnished: use Furnished Type) only stay if picked.
      (!isRetiredAmenity(a.id) || selected.includes(a.id)) &&
      labelOf(a).toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    // Picking an amenity turns off any it contradicts (e.g. No Cooking vs Kitchen).
    onChange(toggleAmenitySelection(selected, id));
  };

  const getLabel = (id: string) => {
    const perk = amenities.find((a) => a.id === id);
    return perk ? labelOf(perk) : id;
  };
  const getIcon = (id: string) => amenities.find((a) => a.id === id)?.icon;

  return (
    <div className="flex flex-col gap-2">
      <Popover onOpenChange={() => setSearch("")}>
        <Popover.Trigger>
          <Button variant="outline" size="sm" className="w-full justify-between">
            {selected.length > 0
              ? t("browse.filter.amenitiesSelected", { count: selected.length })
              : t("browse.filter.amenitiesPlaceholder")}
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
                placeholder={t("browse.filter.amenitiesSearch")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <InputGroup.Suffix>
                <Search size={14} className="text-grey-500" />
              </InputGroup.Suffix>
            </InputGroup>

            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto overflow-x-hidden w-full pr-1">
              {filtered.length === 0 ? (
                <p className="text-sm text-default-400 text-center py-2">{t("browse.filter.amenitiesEmpty")}</p>
              ) : (
                filtered.map((perk) => (
                  <Checkbox
                    key={perk.id}
                    className="group w-full"
                    isSelected={selected.includes(perk.id)}
                    onChange={() => toggle(perk.id)}
                  >
                    <Checkbox.Content>
                      <Checkbox.Control className="size-5 shrink-0 border border-border shadow-none! before:bg-primary! group-data-[selected=true]:border-primary! group-data-[selected=true]:bg-primary!">
                        <Checkbox.Indicator className="[&_svg]:text-white!" />
                      </Checkbox.Control>
                      <span className="flex items-center gap-2">
                        <perk.icon size={14} className="text-muted-foreground shrink-0" />
                        {labelOf(perk)}
                      </span>
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
          {selected.map((id) => {
            const Icon = getIcon(id);
            return (
              <Chip
                key={id}
                size="sm"
                variant="soft"
                className="pl-2.5 pr-1 py-1 gap-1 bg-blue-50 text-blue-600 border border-blue-100"
              >
                {Icon ? <Icon size={12} className="shrink-0" /> : null}
                {getLabel(id)}
                <Button
                  variant="ghost"
                  onClick={() => toggle(id)}
                  className="button--bare cursor-pointer flex items-center justify-center size-3.5 rounded-full bg-blue-100 text-blue-500 hover:bg-blue-200 hover:text-blue-700 transition-colors"
                >
                  <X size={9} strokeWidth={2.5} />
                </Button>
              </Chip>
            );
          })}
        </div>
      )}
    </div>
  );
}