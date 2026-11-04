"use client";

import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { IconTool as Wrench, IconPlus, IconHome } from "@tabler/icons-react";
import MaintenanceRequestModal from "./components/MaintenanceRequestModal";
import MaintenanceOverview from "./components/MaintenanceOverview";
import MaintenanceHistory from "./components/MaintenanceHistory";
import MaintenancePageSkeleton from "./components/MaintenancePageSkeleton";
import { useMaintenanceTenancy } from "@/hooks/use-maintenance-tenancy";
import { canCancelMaintenanceRequest, useMaintenanceRequestHistory } from "@/hooks/use-maintenance-request-history";
import { useMaintenanceOverview } from "@/hooks/use-maintenance-overview";
import ErrorBanner from "@/app/components/display/ErrorBanner";
import PresentationBoundary from "@/app/components/display/PresentationBoundary";
import type { PresentationSeed } from "@/service/presentation-seed";
import type { InitialRentalContext } from "@/service/tenancy-context";
import type { MaintenanceRequest } from "@/service/maintenanceService";
import EmptyState from "@/app/components/display/EmptyState";

export interface MaintenancePresentation {
  context: InitialRentalContext;
  history: PresentationSeed<MaintenanceRequest[]>;
}

export default function MaintenanceClient({ initial }: { initial: PresentationSeed<MaintenancePresentation> }) {
  return <PresentationBoundary initial={initial}>{(seed) => <MaintenanceContent initial={seed?.data} />}</PresentationBoundary>;
}

function MaintenanceContent({ initial }: { initial?: MaintenancePresentation }) {
  const [requestOpen, setRequestOpen] = useState(false);
  const { tenancy, tenantId, loading: tenancyLoading, error: tenancyError } = useMaintenanceTenancy(initial?.context);
  const apartmentId = tenancy?.apartment.id ?? null;
  const {
    requests,
    loading: historyLoading,
    error: historyError,
    revalidate,
    cancelRequest,
    cancellingId,
  } = useMaintenanceRequestHistory(apartmentId, tenantId, false, initial?.history, true);
  const overview = useMaintenanceOverview(apartmentId, tenantId, tenancy?.id ?? null);
  const revalidateOverview = overview.revalidate;
  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState !== "visible") return;
      void revalidate();
      void revalidateOverview();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [revalidate, revalidateOverview]);
  const activeRequests = requests.filter((request) => canCancelMaintenanceRequest(request.status));
  const pastRequests = requests.filter((request) => !canCancelMaintenanceRequest(request.status));
  const reconcile = async () => { await Promise.all([revalidate(), revalidateOverview()]); };
  const handleCancel = async (requestId: string) => {
    const result = await cancelRequest(requestId);
    if (result.success) await reconcile();
    return result;
  };

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
      <div className="px-4 py-6 sm:py-8">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-2 font-nunito text-3xl font-bold text-primary">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Wrench size={28} aria-hidden="true" />
                </span>
                Maintenance
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Let your landlord know about an issue with your unit. We&apos;ll
                notify them right away and keep you posted on the status.
              </p>
            </div>
            <Button variant="primary" className="ml-auto self-end" onPress={() => setRequestOpen(true)} isDisabled={tenancyLoading || !!tenancyError || !tenancy || !apartmentId}>
              <IconPlus size={18} aria-hidden="true" />
              Request Maintenance
            </Button>
          </div>

          {tenancyLoading ? (
            <MaintenancePageSkeleton showHeader={false} />
          ) : tenancyError ? (
            <ErrorBanner message={tenancyError} />
          ) : !tenancy || !apartmentId ? (
            <EmptyState
              framed
              className="py-10"
              icon={IconHome}
              title="No active lease found"
              description="Maintenance requests are linked to your current rental. Once you have an active tenancy, you can submit requests here."
            />
          ) : (
            <>
              <div className="grid items-start gap-4 lg:grid-cols-3 lg:items-stretch">
                <div className="min-w-0 lg:col-span-2 lg:grid">
                  <MaintenanceHistory requests={activeRequests} loading={historyLoading} error={historyError} cancellingId={cancellingId} onCancel={handleCancel} kind="active" onRetry={() => { void revalidate(); }} />
                </div>
                <aside className="min-w-0 lg:grid" aria-label="Maintenance overview">
                  <MaintenanceOverview data={overview.data} loading={overview.loading} error={overview.error} onRetry={() => { void overview.refresh(); }} />
                </aside>
              </div>
              <MaintenanceHistory
                requests={pastRequests}
                loading={historyLoading}
                error={historyError}
                cancellingId={cancellingId}
                onCancel={handleCancel}
                kind="history"
                onRetry={() => { void revalidate(); }}
              />
              <MaintenanceRequestModal key={tenancy.id} apartmentId={apartmentId} apartmentName={apartmentName} address={address} landlordName={landlordName} imageUrl={cover} isOpen={requestOpen} onOpenChange={setRequestOpen} onSubmitted={reconcile} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
