"use client";

export default function ApplicationStatusCardSkeleton() {
  return (
    <div className="border border-border rounded-2xl p-4 flex flex-col gap-3 bg-card">
      <div className="h-5 w-4/5 bg-muted rounded-full animate-pulse" />
      <div className="h-4 w-1/2 bg-muted rounded-full animate-pulse" />
      <div className="h-4 w-full bg-muted rounded-full animate-pulse" />
    </div>
  );
}
