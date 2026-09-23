"use client";

import { useRouter } from "next/navigation";
import { Button, Spinner } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import PropertyContextCard from "./components/PropertyContextCard";
import MaintenanceForm from "./components/MaintenanceForm";
import MaintenanceHistory from "./components/MaintenanceHistory";
import { useTenancy } from "@/hooks/use-tenancy";
import { useMaintenanceRequestHistory } from "@/hooks/use-maintenance-request-history";

export default function MaintenanceRequestPage() {
  const router = useRouter();
  const { tenancy, loading: tenancyLoading } = useTenancy();
  const apartmentId = tenancy?.apartment.id ?? null;
  const {
    requests,
    loading: historyLoading,
    error: historyError,
    refresh,
    cancelRequest,
    cancellingId,
  } = useMaintenanceRequestHistory(apartmentId);

  const apartment = tenancy?.apartment ?? null;
  const landlord = tenancy?.landlord ?? null;
  const propertyName = apartment
    ? [apartment.name, apartment.street_address, apartment.barangay, apartment.city]
        .filter(Boolean)
        .join(" · ")
    : "No property on file";
  const landlordName = landlord
    ? `${landlord.first_name ?? ""} ${landlord.last_name ?? ""}`.trim() || "Landlord"
    : "N/A";

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="w-fit shrink-0" onPress={() => router.back()}>
              <ArrowLeft size={16} />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold font-nunito text-card-foreground">
                Request Maintenance
              </h1>
              <p className="text-sm text-muted-foreground">
                Let your landlord know about an issue with your unit. We&apos;ll
                notify them right away and keep you posted on the status.
              </p>
            </div>
          </div>

          {tenancyLoading ? (
            <div className="flex justify-center py-12">
              <Spinner color="accent" />
            </div>
          ) : !tenancy || !apartmentId ? (
            <div className="rounded-2xl border border-border bg-card p-6 text-center">
              <p className="text-sm font-semibold text-card-foreground">
                No active lease found
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Maintenance requests are linked to your current rental. Once you have an
                active tenancy, you can submit requests here.
              </p>
            </div>
          ) : (
            <>
              <PropertyContextCard propertyName={propertyName} landlordName={landlordName} />
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
