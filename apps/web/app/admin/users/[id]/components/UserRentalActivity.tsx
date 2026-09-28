"use client";

import Link from "next/link";
import { useState } from "react";
import { IconChevronRight, IconHome } from "@tabler/icons-react";
import { Button, Card, Chip, Modal } from "@heroui/react";
import { formatPesoDisplay } from "@repo/utils";
import ApartmentThumbnail from "../../../apartments/components/ApartmentThumbnail";
import { DetailEmptyState } from "./UserDetailPrimitives";

export interface OwnedApartment {
  id: string;
  name: string;
  monthly_rent: number;
  city: string;
  status: string;
  is_verified: boolean;
  is_hidden_by_admin: boolean;
  thumbnail_url: string | null;
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
  tenant_name: string | null;
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

function apartmentLink(apartmentId: string, name: string) {
  return (
    <Link
      href={`/admin/apartments/${apartmentId}`}
      className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {name}
    </Link>
  );
}

interface ApartmentListProps {
  apartments: OwnedApartment[];
  limit?: number;
}

function ApartmentList({ apartments, limit }: ApartmentListProps) {
  if (!apartments.length) {
    return <DetailEmptyState>No owned units</DetailEmptyState>;
  }
  const displayedApartments = limit ? apartments.slice(0, limit) : apartments;
  return (
    <ul className="space-y-2">
      {displayedApartments.map((apartment) => (
        <li key={apartment.id}>
          <Link
            href={`/admin/apartments/${apartment.id}`}
            className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Card className="rounded-2xl border border-border bg-background p-0 shadow-none transition-colors hover:border-primary">
              <Card.Content className="p-2">
                <div className="flex w-full min-w-0 items-center gap-3">
                  <ApartmentThumbnail url={apartment.thumbnail_url} />
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="truncate font-nunito font-semibold text-primary">
                      {apartment.name}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {apartment.city} ·{" "}
                      {formatPesoDisplay(apartment.monthly_rent)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
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
                  </div>
                </div>
              </Card.Content>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function LandlordTenancies({
  tenancies,
  apartments,
  limit,
}: {
  tenancies: ActiveTenancy[];
  apartments: OwnedApartment[];
  limit?: number;
}) {
  if (!tenancies.length) {
    return (
      <DetailEmptyState>No active tenancies on owned units</DetailEmptyState>
    );
  }
  const displayedTenancies = limit ? tenancies.slice(0, limit) : tenancies;
  return (
    <ul className="space-y-2">
      {displayedTenancies.map((tenancy) => (
        <li key={tenancy.id}>
          <Link
            href={`/admin/apartments/${tenancy.apartment_id}`}
            className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Card className="rounded-2xl border border-border bg-background p-0 shadow-none transition-colors hover:border-primary">
              <Card.Content className="p-2">
                <div className="flex w-full min-w-0 items-center gap-3">
                  <ApartmentThumbnail
                    url={
                      apartments.find(
                        (apartment) => apartment.id === tenancy.apartment_id,
                      )?.thumbnail_url ?? null
                    }
                  />
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="truncate font-nunito font-semibold text-primary">
                      {tenancy.apartment_name}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      Rented by {tenancy.tenant_name ?? "Unknown tenant"} ·
                      since{" "}
                      {dateFormatter.format(new Date(tenancy.lease_start))}
                    </p>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function TenantTenancy({ tenancies }: { tenancies: ActiveTenancy[] }) {
  const current =
    tenancies.find((item) => item.status === "active") ?? tenancies[0] ?? null;
  if (!current) {
    return <DetailEmptyState>No active tenancy</DetailEmptyState>;
  }
  return (
    <p className="text-sm">
      {apartmentLink(current.apartment_id, current.apartment_name)}{" "}
      <span className="text-muted-foreground">
        · {current.status} · since{" "}
        {dateFormatter.format(new Date(current.lease_start))}
        {current.monthly_rent !== null
          ? ` · ${formatPesoDisplay(current.monthly_rent)}`
          : ""}
      </span>
    </p>
  );
}

function Eyebrow({ children }: { children: string }) {
  return (
    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
      {children}
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
  const isTenant = roles.includes("tenant") || !isLandlord;
  const [isApartmentsModalOpen, setIsApartmentsModalOpen] = useState(false);
  const [isTenanciesModalOpen, setIsTenanciesModalOpen] = useState(false);
  return (
    <Card className="rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">
      <Card.Content className="p-0">
        <h2 className="flex items-center gap-2 font-nunito text-lg font-bold text-primary">
          <IconHome
            size={20}
            className="shrink-0 text-primary"
            aria-hidden="true"
          />
          Rental activity
        </h2>
        {isLandlord ? (
          <>
            <div className="mt-3">
              <Eyebrow>{`Owned units · ${apartments.length}`}</Eyebrow>
            </div>
            <div className="mt-1.5">
              <ApartmentList apartments={apartments} limit={3} />
            </div>
            {apartments.length > 3 ? (
              <Button
                variant="tertiary"
                size="sm"
                className="mt-2"
                onPress={() => setIsApartmentsModalOpen(true)}
              >
                See all {apartments.length} apartments
                <IconChevronRight size={16} aria-hidden="true" />
              </Button>
            ) : null}
            <div className="mt-4">
              <Eyebrow>{`Active tenancies · ${tenanciesAsLandlord.length}`}</Eyebrow>
            </div>
            <div className="mt-1.5">
              <LandlordTenancies
                tenancies={tenanciesAsLandlord}
                apartments={apartments}
                limit={3}
              />
            </div>
            {tenanciesAsLandlord.length > 3 ? (
              <Button
                variant="tertiary"
                size="sm"
                className="mt-2"
                onPress={() => setIsTenanciesModalOpen(true)}
              >
                See all {tenanciesAsLandlord.length} tenancies
                <IconChevronRight size={16} aria-hidden="true" />
              </Button>
            ) : null}
          </>
        ) : null}
        {isTenant ? (
          <>
            <div className="mt-3">
              <Eyebrow>Current tenancy</Eyebrow>
            </div>
            <div className="mt-1.5">
              <TenantTenancy tenancies={tenanciesAsTenant} />
            </div>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              <div>
                <Eyebrow>{`Applications · ${applicationTotal}`}</Eyebrow>
                <div className="mt-2 space-y-1.5">
                  {applications.length ? (
                    applications.slice(0, 3).map((item) => (
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
                <Eyebrow>{`Visit requests · ${visitTotal}`}</Eyebrow>
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
            </div>
          </>
        ) : null}
      </Card.Content>
      <Modal
        isOpen={isApartmentsModalOpen}
        onOpenChange={setIsApartmentsModalOpen}
      >
        <Modal.Backdrop>
          <Modal.Container size="lg" scroll="inside">
            <Modal.Dialog className="p-0">
              <Modal.CloseTrigger className="text-foreground!" />
              <Modal.Header className="px-5 py-3">
                <Modal.Heading className="font-nunito font-bold text-xl">
                  Owned apartments
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="max-h-[60vh] overflow-y-auto p-5">
                <ApartmentList apartments={apartments} />
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
      <Modal
        isOpen={isTenanciesModalOpen}
        onOpenChange={setIsTenanciesModalOpen}
      >
        <Modal.Backdrop>
          <Modal.Container size="lg" scroll="inside">
            <Modal.Dialog className="p-0">
              <Modal.CloseTrigger className="text-foreground!" />
              <Modal.Header className="px-5 py-3">
                <Modal.Heading className="font-nunito font-bold text-xl">
                  Active tenancies
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="max-h-[60vh] overflow-y-auto p-5">
                <LandlordTenancies
                  tenancies={tenanciesAsLandlord}
                  apartments={apartments}
                />
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </Card>
  );
}
