"use client";

import { Hammer } from "lucide-react";

export default function MaintenanceEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-12 text-muted-foreground">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
        <Hammer size={20} className="text-primary" />
      </span>
      <p className="text-sm font-medium mt-3 text-card-foreground">No maintenance requests</p>
      <p className="text-xs mt-1">New tenant requests will appear here.</p>
    </div>
  );
}
