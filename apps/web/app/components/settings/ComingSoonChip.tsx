"use client";

import { Chip } from "@heroui/react";

export default function ComingSoonChip() {
  return (
    <Chip size="sm" variant="soft" color="default" className="px-2 py-0.5">
      <Chip.Label className="text-[11px] font-nunito font-semibold text-muted-foreground">
        Coming soon
      </Chip.Label>
    </Chip>
  );
}