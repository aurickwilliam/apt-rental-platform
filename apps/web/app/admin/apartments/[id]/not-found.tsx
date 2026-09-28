import Link from "next/link";
import { Card } from "@heroui/react";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-7xl p-4">
      <Card className="rounded-3xl border border-border bg-card p-5 shadow-none">
        <Card.Content className="p-0">
          <h1 className="font-nunito text-xl font-bold">Apartment not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This listing may have been removed or the address may be incorrect.
          </p>
          <Link
            href="/admin/apartments"
            className="mt-4 inline-block font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
          >
            Back to apartments
          </Link>
        </Card.Content>
      </Card>
    </div>
  );
}
