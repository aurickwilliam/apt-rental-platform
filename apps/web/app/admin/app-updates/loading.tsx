import { Skeleton } from "@heroui/react";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 p-4" aria-busy="true">
      <Skeleton className="h-11 w-56 rounded-lg bg-skeleton!" />
      <Skeleton className="h-[26rem] w-full rounded-3xl bg-skeleton!" />
    </div>
  );
}
