"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import { ClipboardX } from "lucide-react";

export default function ApplicationsEmptyState() {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-10 border border-dashed border-border rounded-2xl bg-card">
      <ClipboardX size={48} className="text-primary" />
      <h3 className="text-lg font-bold text-card-foreground">No Applications Yet</h3>
      <p className="text-sm text-muted-foreground px-8 max-w-sm">
        You haven&apos;t applied to any apartment yet. Browse listings and submit an application to get started.
      </p>
      <Link href="/browse">
        <Button>Browse Listings</Button>
      </Link>
    </div>
  );
}
