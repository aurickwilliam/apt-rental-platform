"use client";

import Link from "next/link";
import { Button } from "@heroui/react";
import { Home } from "lucide-react";

type TenancyEmptyStateProps = {
  description?: string;
};

export default function TenancyEmptyState({ description }: TenancyEmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-10 border border-dashed border-border rounded-2xl bg-card">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border border-primary/15">
        <Home size={40} className="text-primary" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-card-foreground">
          No active tenancy yet
        </h3>
        <p className="text-sm text-muted-foreground px-8 max-w-sm">
          {description ?? "You're not currently renting an apartment. Browse verified listings to find your next home."}
        </p>
      </div>

      <Link href="/browse">
        <Button>Browse Listings</Button>
      </Link>
    </div>
  );
}