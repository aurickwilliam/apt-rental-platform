import { Skeleton } from "@heroui/react";

export default function PaymentHistorySkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading payment history" className="flex flex-col gap-3">
      <Skeleton className="h-8 w-full rounded-md bg-grey-300!" />
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-10 w-full rounded-md bg-grey-300!" />
      ))}
    </div>
  );
}
