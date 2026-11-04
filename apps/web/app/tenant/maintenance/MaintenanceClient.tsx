"use client";

import { IconTool as Wrench } from "@tabler/icons-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SettingsSelect from "@/app/components/settings/SettingsSelect";
import PropertyContextCard from "./components/PropertyContextCard";
import MaintenanceForm from "./components/MaintenanceForm";
import MaintenanceHistory from "./components/MaintenanceHistory";
import MaintenancePageSkeleton from "./components/MaintenancePageSkeleton";
import { useMaintenanceTenancy } from "@/hooks/use-maintenance-tenancy";
import { useMaintenanceRequestHistory } from "@/hooks/use-maintenance-request-history";
import ErrorBanner from "@/app/components/display/ErrorBanner";
import PresentationBoundary from "@/app/components/display/PresentationBoundary";
import type { PresentationSeed } from "@/service/presentation-seed";
import type { MaintenanceRentalContext } from "@/hooks/use-maintenance-tenancy";
import type { MaintenanceRequest } from "@/service/maintenanceService";

export interface MaintenancePresentation {
  context: MaintenanceRentalContext;
  history: PresentationSeed<MaintenanceRequest[]>;
}

export default function MaintenanceClient({ initial }: { initial: PresentationSeed<MaintenancePresentation> }) {
  return <PresentationBoundary initial={initial}>{(seed) => <MaintenanceContent initial={seed?.data} />}</PresentationBoundary>;
}

function MaintenanceContent({ initial }: { initial?: MaintenancePresentation }) {
  const searchParams = useSearchParams();
  const { tenancy, tenancies, tenantId, loading: tenancyLoading, error: tenancyError } = useMaintenanceTenancy(initial?.context, searchParams.get("tenancyId") ?? undefined);
  const apartmentId = tenancy?.apartment.id ?? null;
  const {
    requests,
    loading: historyLoading,
    error: historyError,
    refresh,
    cancelRequest,
    cancellingId,
  } = useMaintenanceRequestHistory(null, tenantId, false, initial?.history, true);

  const chooseRental = (id: string) => {
    const query = new URLSearchParams(searchParams.toString());
    query.set("tenancyId", id);
    window.history.replaceState(null, "", `/tenant/maintenance?${query}#new-request`);
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

          {!tenancyLoading && !tenancyError && (tenancies.length > 1 || (!tenancy && tenancies.length > 0)) ? (
            <div className="max-w-lg rounded-2xl border border-border bg-card p-4">
              <p className="mb-2 text-sm text-muted-foreground">Choose the rental you want to report an issue for.</p>
              <SettingsSelect label="Rental for maintenance" className="w-full min-w-0" value={tenancy?.id ?? ""} placeholder="Choose your rental" onChange={chooseRental}
                options={tenancies.map(item => ({ value: item.id, label: `${item.apartment.name} · ${item.apartment.barangay}, ${item.apartment.city}` }))} />
            </div>
          ) : null}

          {tenancyLoading ? (
            <MaintenancePageSkeleton showHeader={false} />
          ) : tenancyError ? (
            <ErrorBanner message={tenancyError} />
          ) : !tenancy || !apartmentId ? (
            <div className="rounded-2xl border border-border bg-card p-6 text-center">
              <p className="font-nunito text-sm font-semibold text-card-foreground">
                {tenancies.length > 0 ? "Choose a rental to request maintenance" : "No current active rental"}
              </p>
              <p className="font-inter text-sm text-muted-foreground mt-1">
                 Maintenance reporting is available for a current active tenancy, not a pending or approved application. Your previous requests remain below.
              </p>
            </div>
          ) : (
            <>
              <PropertyContextCard apartmentName={apartmentName} address={address} landlordName={landlordName} imageUrl={cover} />
              <div id="new-request" className="scroll-mt-20">
                <MaintenanceForm key={tenancy.id} apartmentId={apartmentId} tenancyId={tenancy.id} onSubmitted={refresh} />
              </div>
            </>
          )}
          <div id="requests" className="scroll-mt-20">
            <MaintenanceHistory requests={requests} loading={historyLoading} error={historyError} cancellingId={cancellingId} onCancel={cancelRequest}
              requestAction={tenancy && !tenancyError ? <Link href="#new-request" className="button button--primary">Request maintenance</Link> : undefined} />
          </div>
        </div>
      </div>
    </div>
  );
}
