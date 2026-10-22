"use client";

import { IconTool as Wrench } from "@tabler/icons-react";
import PropertyContextCard from "./components/PropertyContextCard";
import MaintenanceForm from "./components/MaintenanceForm";
import MaintenanceHistory from "./components/MaintenanceHistory";
import MaintenancePageSkeleton from "./components/MaintenancePageSkeleton";
import { useMaintenanceTenancy } from "@/hooks/use-maintenance-tenancy";
import { useMaintenanceRequestHistory } from "@/hooks/use-maintenance-request-history";
import ErrorBanner from "@/app/components/display/ErrorBanner";

export default function MaintenanceRequestPage() {
  const { tenancy, tenantId, loading: tenancyLoading, error: tenancyError } = useMaintenanceTenancy();
  const apartmentId = tenancy?.apartment.id ?? null;
  const {
    requests,
    loading: historyLoading,
    error: historyError,
    refresh,
    cancelRequest,
    cancellingId,
  } = useMaintenanceRequestHistory(apartmentId, tenantId);

  const apartment = tenancy?.apartment ?? null;
  const landlord = tenancy?.landlord ?? null;
  const apartmentName = apartment?.name ?? "No property on file";
  const address = apartment
    ? [apartment.street_address, apartment.barangay, apartment.city]
        .filter(Boolean)
        .join(", ")
    : "";
  const cover =
    apartment?.apartment_images?.find((img) => img.is_cover)?.url ??
    apartment?.apartment_images?.[0]?.url ??
    null;
  const landlordName = landlord
    ? `${landlord.first_name ?? ""} ${landlord.last_name ?? ""}`.trim() || "Landlord"
    : "N/A";

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Header */}
          <div>
            <h1 className="flex items-center gap-2 font-nunito text-3xl font-bold text-primary">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Wrench size={28} aria-hidden="true" />
              </span>
              Request Maintenance
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Let your landlord know about an issue with your unit. We&apos;ll
              notify them right away and keep you posted on the status.
            </p>
          </div>

          {tenancyLoading ? (
            <MaintenancePageSkeleton showHeader={false} />
          ) : tenancyError ? (
            <ErrorBanner message={tenancyError} />
          ) : !tenancy || !apartmentId ? (
            <div className="rounded-2xl border border-border bg-card p-6 text-center">
              <p className="font-nunito text-sm font-semibold text-card-foreground">
                No active lease found
              </p>
              <p className="font-inter text-sm text-muted-foreground mt-1">
                Maintenance requests are linked to your current rental. Once you have an
                active tenancy, you can submit requests here.
              </p>
            </div>
          ) : (
            <>
              <PropertyContextCard apartmentName={apartmentName} address={address} landlordName={landlordName} imageUrl={cover} />
              <MaintenanceForm apartmentId={apartmentId} onSubmitted={refresh} />
              <MaintenanceHistory
                requests={requests}
                loading={historyLoading}
                error={historyError}
                cancellingId={cancellingId}
                onCancel={cancelRequest}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
