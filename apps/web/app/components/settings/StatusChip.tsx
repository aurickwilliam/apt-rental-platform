"use client";

import { Chip } from "@heroui/react";

// Small muted chip explaining why a settings row is unavailable.
export default function StatusChip({ label }: { label: string }) {
  return (
    <Chip size="sm" variant="soft" color="default" className="px-2 py-0.5">
      <Chip.Label className="text-[11px] font-nunito font-semibold text-muted-foreground">
        {label}
      </Chip.Label>
    </Chip>
  );
}
