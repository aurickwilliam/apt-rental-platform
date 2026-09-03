"use client";

import Link from "next/link";
import { Button } from "@heroui/react";
import { ArrowRight, Home } from "lucide-react";

type TenancyEmptyStateProps = {
  description?: string;
};

export default function TenancyEmptyState({ description }: TenancyEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-6 bg-card border border-default-200 rounded-2xl px-6 py-14 max-w-xl w-full mx-auto">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border border-primary/15">
        <Home size={40} className="text-primary" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-2xl font-semibold text-foreground">
          No active tenancy yet
        </h2>
        <p className="text-sm text-muted-foreground max-w-md">
          {description ?? "You're not currently renting an apartment. Browse verified listings to find your next home."}
        </p>
      </div>

      <Link href="/browse">
        <Button variant="primary" size="lg">
          Browse listings <ArrowRight size={16} className="ml-2" />
        </Button>
      </Link>
    </div>
  );
}