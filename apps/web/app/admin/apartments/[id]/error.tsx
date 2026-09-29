"use client";

import Link from "next/link";
import { Button, Card } from "@heroui/react";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-7xl p-4">
      <Card
        role="alert"
        className="rounded-3xl border border-border bg-card p-5 shadow-none"
      >
        <Card.Content className="p-0">
          <h1 className="font-nunito text-xl font-bold">
            Apartment details unavailable
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We couldn’t load this apartment. Try again or return to the list.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="primary" onPress={reset}>
              Try again
            </Button>
            <Link
              href="/admin/apartments"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Back to apartments
            </Link>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
