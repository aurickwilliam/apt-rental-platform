import { Skeleton } from "@/components/ui/skeleton";

export default function PerformanceSkeleton() {
  return <div className="space-y-5" aria-hidden="true">
    <Skeleton className="h-9 w-64 max-w-full" />
    <Skeleton className="h-4 w-48" />
    <div className="space-y-5 rounded-xl border border-border p-4">
      <Skeleton className="h-9 w-80 max-w-full rounded-full" />
      {Array.from({ length: 4 }, (_, index) => <div key={index} className="space-y-2"><Skeleton className="h-5 w-full" /><Skeleton className="h-2 w-full rounded-full" /><Skeleton className="h-3 w-64 max-w-full" /></div>)}
    </div>
  </div>;
}
