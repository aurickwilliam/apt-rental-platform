"use client";

import { Card, Skeleton } from "@heroui/react";

import PaymentsHeader from "./PaymentsHeader";

const CARD_COUNT = 3;

function Sk({ className }: { className: string }) {
  return <Skeleton className={`bg-grey-300! ${className}`} />;
}

export function PaymentCardsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading payments">
      <div aria-hidden="true" className="space-y-3">
        <div className="py-2">
          <Sk className="h-8 w-24 rounded-xl" />
        </div>
        <div className="grid gap-3">
          {Array.from({ length: CARD_COUNT }, (_, index) => (
            <Card key={index} className="rounded-2xl border border-border bg-card shadow-sm">
              <Card.Header className="px-4 pt-4 pb-1">
                <div className="flex items-center justify-between gap-2">
                  <Sk className="h-5 w-32 min-w-0 rounded-lg" />
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Sk className="h-5 w-16 rounded-full" />
                    <Sk className="h-5 w-16 rounded-full" />
                  </div>
                </div>
              </Card.Header>
              <Card.Content className="px-4 pb-2">
                <Sk className="h-5 w-24 rounded-lg" />
                <Sk className="mt-0.5 h-4 w-32 rounded-lg" />
              </Card.Content>
              <Card.Footer className="px-4 pb-4 flex items-center justify-between gap-2">
                <Sk className="h-4 w-36 min-w-0 rounded-lg" />
                <Sk className="h-4 w-24 shrink-0 rounded-lg" />
              </Card.Footer>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PaymentsSkeleton() {
  return (
    <div className="p-4 space-y-4" aria-busy="true" aria-label="Loading payments">
      <PaymentsHeader>
        <div aria-hidden="true"><Sk className="h-8 w-24 rounded-full" /></div>
      </PaymentsHeader>
      <div aria-hidden="true" className="max-w-md">
        <Sk className="h-10 w-full rounded-xl" />
      </div>
      <PaymentCardsSkeleton />
    </div>
  );
}
