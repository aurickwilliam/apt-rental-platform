"use client";

import { ClipboardList } from "lucide-react";
import { usePendingApplications } from "@/hooks/use-pending-applications";
import ApplicationStatusCard from "./ApplicationStatusCard";
import ApplicationStatusCardSkeleton from "./ApplicationStatusCardSkeleton";
import ApplicationsEmptyState from "./ApplicationsEmptyState";

export default function ApplicationsList({ className = "" }: { className?: string }) {
  const { applications, loading } = usePendingApplications();

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-center gap-2">
        <ClipboardList size={20} className="text-primary" />
        <h2 className="text-lg font-semibold text-card-foreground">My Applications</h2>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          <ApplicationStatusCardSkeleton />
          <ApplicationStatusCardSkeleton />
          <ApplicationStatusCardSkeleton />
        </div>
      ) : applications.length === 0 ? (
        <ApplicationsEmptyState />
      ) : (
        <div className="flex flex-col gap-3">
          {applications.map((a) => (
            <ApplicationStatusCard
              key={a.id}
              id={a.id}
              status={a.status}
              apartmentName={a.apartmentName}
              apartmentId={a.apartmentId}
              createdAt={a.createdAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
