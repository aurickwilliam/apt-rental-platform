"use client";

import { ClipboardList } from "lucide-react";
import { useTenantApplications } from "@/hooks/use-tenant-applications";
import ApplicationStatusCard from "./ApplicationStatusCard";
import ApplicationStatusCardSkeleton from "./ApplicationStatusCardSkeleton";
import ApplicationsEmptyState from "./ApplicationsEmptyState";

export default function ApplicationsList({ className = "" }: { className?: string }) {
  const { applications, loading, error } = useTenantApplications();

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
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : applications.length === 0 ? (
        <ApplicationsEmptyState />
      ) : (
        <div className="flex flex-col gap-3">
          {applications.map((a) => (
            <ApplicationStatusCard
              key={a.id}
              id={a.id}
              status={a.status}
              apartmentName={a.apartments?.name ?? null}
              apartmentId={a.apartment_id}
              createdAt={a.created_at}
            />
          ))}
        </div>
      )}
    </div>
  );
}
