"use client";

import { Button, Link } from "@heroui/react";
import { Home } from "lucide-react";

type TenancyEmptyStateProps = {
  description?: string;
};

export default function TenancyEmptyState({ description }: TenancyEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-4 py-20">
      <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
        <Home size={28} className="text-zinc-400" />
      </div>

      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          No Active Tenancy
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
          {description ?? "You're not currently renting any apartment. Browse listings to find your next home."}
        </p>
      </div>

      <Link href="/browse" className="mt-2">
        <Button>
          Browse listings
        </Button>
      </Link>
    </div>
  );
}
