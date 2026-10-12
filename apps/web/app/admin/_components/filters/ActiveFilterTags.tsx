"use client";

import { Button, Tag, TagGroup } from "@heroui/react";
import type { ActiveFilterTag } from "./types";

interface ActiveFilterTagsProps {
  tags: ActiveFilterTag[];
  onRemove: (ids: string[]) => void;
  onClearAll: () => void;
}

export default function ActiveFilterTags({
  tags,
  onRemove,
  onClearAll,
}: ActiveFilterTagsProps) {
  if (!tags.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <TagGroup
        aria-label="Active filters"
        size="sm"
        onRemove={(keys) => onRemove(Array.from(keys, String))}
      >
        <TagGroup.List items={tags} className="flex flex-wrap gap-2">
          {(tag) => (
            <Tag id={tag.id} textValue={tag.label}>
              {tag.label}
            </Tag>
          )}
        </TagGroup.List>
      </TagGroup>
      <Button
        variant="ghost"
        size="sm"
        onPress={onClearAll}
        className="cursor-pointer text-primary"
      >
        Clear all
      </Button>
    </div>
  );
}
