"use client";

import StatusChip from "@/app/components/display/StatusChip";

// Small neutral chip explaining why a settings row is unavailable.
export default function SettingsStatusChip({ label }: { label: string }) {
  return (
    <StatusChip tone="neutral" className="px-2 py-0.5">
      <span className="text-[11px] font-nunito font-semibold">{label}</span>
    </StatusChip>
  );
}
