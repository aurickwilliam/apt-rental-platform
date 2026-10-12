"use client";

import { Label, Tag, TagGroup, type Selection } from "@heroui/react";
import type { FilterOption } from "./types";

interface BasePillGroupProps<T extends string> {
  label: string;
  options: readonly FilterOption<T>[];
}

interface MultiplePillGroupProps<T extends string>
  extends BasePillGroupProps<T> {
  selectionMode: "multiple";
  value: T[];
  onChange: (value: T[]) => void;
}

interface SinglePillGroupProps<T extends string> extends BasePillGroupProps<T> {
  selectionMode: "single";
  value: T;
  onChange: (value: T) => void;
}

type FilterPillGroupProps<T extends string> =
  | MultiplePillGroupProps<T>
  | SinglePillGroupProps<T>;

// `!` is needed because @heroui/styles ships unlayered CSS (including the
// selected state) that otherwise beats layered Tailwind utilities.
const PILL_CLASSES =
  "cursor-pointer rounded-full px-3 data-[selected=true]:bg-primary! data-[selected=true]:text-white! data-[selected=true]:hover:bg-primary/90!";

/**
 * Selectable pills, mirroring the mobile search filter sheet (HeroUI
 * TagGroup with selection): selected pills fill with the primary blue.
 */
export default function FilterPillGroup<T extends string>(
  props: FilterPillGroupProps<T>,
) {
  const selectedKeys = new Set<string>(
    props.selectionMode === "multiple" ? props.value : [props.value],
  );

  function handleSelectionChange(keys: Selection) {
    if (keys === "all") return;
    const next = Array.from(keys, String) as T[];
    if (props.selectionMode === "multiple") {
      props.onChange(next);
      return;
    }
    if (next[0] !== undefined) props.onChange(next[0]);
  }

  return (
    <TagGroup
      selectionMode={props.selectionMode}
      disallowEmptySelection={props.selectionMode === "single"}
      selectedKeys={selectedKeys}
      onSelectionChange={handleSelectionChange}
      className="space-y-2"
    >
      <Label className="text-sm font-semibold">{props.label}</Label>
      <TagGroup.List className="flex flex-wrap gap-2">
        {props.options.map((option) => (
          <Tag
            key={option.id}
            id={option.id}
            textValue={option.label}
            className={PILL_CLASSES}
          >
            {option.label}
          </Tag>
        ))}
      </TagGroup.List>
    </TagGroup>
  );
}
