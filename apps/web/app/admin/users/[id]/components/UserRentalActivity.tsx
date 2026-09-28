import Link from "next/link";
import { Chip } from "@heroui/react";
import { formatPesoDisplay } from "@repo/utils";
import { DetailEmptyState } from "./UserDetailPrimitives";

export interface OwnedApartment {
  id: string;
  name: string;
  monthly_rent: number;
  city: string;
  status: string;
  is_verified: boolean;
  is_hidden_by_admin: boolean;
}

export interface ActiveTenancy {
  id: string;
  status: string;
  lease_start: string;
  lease_end: string | null;
  monthly_rent: number | null;
  apartment_id: string;
  apartment_name: string;
  counterparty_role: "tenant" | "landlord";
}

export interface PipelineApplication {
  id: string;
  status: string;
  created_at: string;
  apartment_name: string;
}

export interface PipelineVisit {
  id: string;
  status: string;
  visit_date: string;
  apartment_name: string;
}

interface UserRentalActivityProps {
  roles: string[];
  apartments: OwnedApartment[];
  tenanciesAsTenant: ActiveTenancy[];
  tenanciesAsLandlord: ActiveTenancy[];
  applications: PipelineApplication[];
  applicationTotal: number;
  visits: PipelineVisit[];
  visitTotal: number;
}

const dateFormatter = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" });

function TenancyLine({ tenancy }: { tenancy: ActiveTenancy }) {
  return (
    <p className="text-sm">
      <Link
        href={`/admin/apartments/${tenancy.apartment_id}`}
        className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {tenancy.apartment_name}
      </Link>{" "}
      <span className="text-muted-foreground">
        · {tenancy.status} · since{" "}
        {dateFormatter.format(new Date(tenancy.lease_start))}
        {tenancy.monthly_rent !== null
          ? ` · ${formatPesoDisplay(tenancy.monthly_rent)}`
          : ""}
      </span>
    </p>
  );
}

export default function UserRentalActivity({
  roles,
  apartments,
  tenanciesAsTenant,
  tenanciesAsLandlord,
  applications,
  applicationTotal,
  visits,
  visitTotal,
}: UserRentalActivityProps) {
  const isLandlord = roles.includes("landlord");
  const currentTenancy =
    tenanciesAsTenant.find((item) => item.status === "active") ??
    tenanciesAsTenant[0] ??
    null;
  return (
    <section className="rounded-3xl border border-border bg-card p-4 sm:p-5">
      <h2 className="font-nunito text-lg font-bold">Rental activity</h2>
      <p className="mt-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Current tenancy
      </p>
      <div className="mt-1.5">
        {isLandlord ? (
          apartments.length ? (
            <ul className="space-y-2">
              {apartments.slice(0, 4).map((apartment) => (
                <li
                  key={apartment.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <span className="min-w-0">
                    <Link
                      href={`/admin/apartments/${apartment.id}`}
                      className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {apartment.name}
                    </Link>{" "}
                    <span className="text-muted-foreground">
                      · {apartment.city} ·{" "}
                      {formatPesoDisplay(apartment.monthly_rent)}
                    </span>
                  </span>
                  <span className="flex shrink-0 gap-1">
                    <Chip
                      size="sm"
                      variant="soft"
                      color={apartment.is_verified ? "success" : "default"}
                    >
                      {apartment.is_verified ? "Verified" : "Unverified"}
                    </Chip>
                    {apartment.is_hidden_by_admin ? (
                      <Chip size="sm" variant="soft" color="danger">
                        Hidden
                      </Chip>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <DetailEmptyState>No active apartments</DetailEmptyState>
          )
        ) : currentTenancy ? (
          <TenancyLine tenancy={currentTenancy} />
        ) : (
          <DetailEmptyState>No active tenancy</DetailEmptyState>
        )}
      </div>
      {isLandlord && tenanciesAsLandlord.length ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {tenanciesAsLandlord.length} active tenanc
          {tenanciesAsLandlord.length === 1 ? "y" : "ies"} on owned units
        </p>
      ) : null}
      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Applications · {applicationTotal}
          </p>
          <div className="mt-2 space-y-1.5">
            {applications.length ? (
              applications
                .slice(0, 3)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      {item.apartment_name}
                    </span>
                    <Chip
                      size="sm"
                      variant="soft"
                      className="shrink-0 capitalize"
                    >
                      {item.status}
                    </Chip>
                  </div>
                ))
            ) : (
              <p className="text-sm text-muted-foreground">None</p>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Visit requests · {visitTotal}
          </p>
          <div className="mt-2 space-y-1.5">
            {visits.length ? (
              visits.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="min-w-0 truncate">
                    {item.apartment_name} ·{" "}
                    {dateFormatter.format(new Date(item.visit_date))}
                  </span>
                  <Chip size="sm" variant="soft" className="shrink-0 capitalize">
                    {item.status}
                  </Chip>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">None</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
