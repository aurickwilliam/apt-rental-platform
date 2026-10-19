"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Chip,
  Dropdown,
  Label,
  Modal,
  toast,
  useOverlayState,
} from "@heroui/react";
import StatusChip from "@/app/components/display/StatusChip";
import type { StatusTone } from "@/lib/status-tone";
import { IconArrowLeft as ArrowLeft, IconRosetteDiscountCheck as BadgeCheck, IconStar as Star, IconFileText as FileText, IconFileUpload as FileUp, IconPencil as Pencil, IconDots as MoreHorizontal, IconTrash as Trash2, IconMessageCircle as MessageCircle, IconTool as Wrench, IconCashBanknote as Banknote, IconChevronRight as ChevronRight, IconCircleCheck as CircleCheck, IconHome as House } from "@tabler/icons-react";
import { formatPesoDisplay } from "@repo/utils";
import { createClient } from "@repo/supabase/browser";
import UserAvatar from "@/app/components/profile/UserAvatar";
import {
  formatLeaseDate,
  methodLabel,
  paymentStatusLabel,
  statusVariant,
} from "@/app/tenant/payment/utils";
import { signedLeaseStatus, type SignedLeaseStatus } from "@/lib/signed-lease";
import { useSignedLeaseViewer } from "@/hooks/use-signed-lease-viewer";
import {
  removeLandlordUnit,
  vacateLandlordUnit,
  type LandlordUnitApartment,
  type LandlordUnitDetail,
  type LandlordUnitTenant,
} from "@/service/landlordUnitDetailService";
import { toProperty } from "./to-property";
import { useLeaseViewer } from "./use-lease-viewer";
import SignedLeaseModal from "./SignedLeaseModal";
import PropertyPhotoGallery from "./PropertyPhotoGallery";
import { STATUS_COLOR } from "../../components/propertyConstants";
import { PERKS } from "@/app/components/inputs/perks";
import ApartmentImagesModal from "../../components/modals/ApartmentImagesModal";
import LeaseAgreementModal from "../../components/modals/LeaseAgreementModal";
import DescriptionModal from "../../components/modals/DescriptionModal";
import AmenitiesModal from "../../components/modals/AmenitiesModal";
import EditPropertyModal from "../../components/modals/EditPropertyModal";
import DeletePropertyModal from "../../components/modals/DeletePropertyModal";

function buildAddress(apartment: LandlordUnitApartment): string {
  const parts = [
    apartment.street_address,
    apartment.barangay,
    apartment.city,
    apartment.province,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

function getInitials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

function DetailField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-sm font-nunito text-muted-foreground">{label}</p>
      <p className="text-[15px] font-nunito font-semibold text-card-foreground leading-snug">
        {value ?? "—"}
      </p>
    </div>
  );
}

const SIGNED_LEASE_LABEL: Record<SignedLeaseStatus, string> = {
  missing: "Not uploaded",
  pending: "Awaiting tenant",
  acknowledged: "Confirmed",
};

const SIGNED_LEASE_CHIP_COLOR: Record<SignedLeaseStatus, StatusTone> = {
  missing: "neutral",
  pending: "warning",
  acknowledged: "success",
};

function signedLeaseHint(tenant: LandlordUnitTenant): string {
  const status = signedLeaseStatus(tenant.signedLeasePath, tenant.tenantAcknowledgedAt);
  if (status === "missing") {
    return "Upload the contract both parties signed so the tenant can review and confirm it.";
  }
  const uploaded = tenant.signedLeaseUploadedAt
    ? `Uploaded ${formatLeaseDate(tenant.signedLeaseUploadedAt)}`
    : "On file";
  if (status === "acknowledged" && tenant.tenantAcknowledgedAt) {
    return `${uploaded} · Confirmed by the tenant ${formatLeaseDate(tenant.tenantAcknowledgedAt)}`;
  }
  return `${uploaded} · The tenant has not confirmed it yet.`;
}

export default function PropertyDetailClient({ detail }: { detail: LandlordUnitDetail }) {
  const router = useRouter();
  const [apartment, setApartment] = useState(detail.apartment);
  const [actionError, setActionError] = useState<string | null>(null);
  const [vacating, setVacating] = useState(false);
  const [vacateOpen, setVacateOpen] = useState(false);
  const vacateState = useOverlayState({ isOpen: vacateOpen, onOpenChange: setVacateOpen });

  const [imagesModalOpen, setImagesModalOpen] = useState(false);
  const [leaseModalOpen, setLeaseModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [amenitiesModalOpen, setAmenitiesModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [signedLeaseOpen, setSignedLeaseOpen] = useState(false);
  const { viewLease, viewing: viewingLease } = useLeaseViewer();
  const { viewSignedLease, viewing: viewingSignedLease } = useSignedLeaseViewer();

  const property = toProperty(apartment);
  const isOccupied = apartment.status === "occupied";
  const tenant = detail.tenant;
  const tenantLeaseStatus = signedLeaseStatus(tenant?.signedLeasePath, tenant?.tenantAcknowledgedAt);
  const amenities = apartment.amenities
    .map((id) => ({ id, perk: PERKS[id] }))
    .filter((item) => item.perk);
  const totalMoveIn =
    apartment.monthly_rent + (apartment.security_deposit ?? 0) + (apartment.advance_rent ?? 0);

  const STATS = [
    { label: "Monthly Rent", value: formatPesoDisplay(apartment.monthly_rent), icon: Banknote, primary: true },
    { label: "Average Rating", value: apartment.average_rating != null ? String(apartment.average_rating) : "—", icon: Star, primary: false },
    { label: "Total Reviews", value: String(apartment.no_ratings ?? 0), icon: FileText, primary: false },
    { label: "Status", value: apartment.status, icon: CircleCheck, primary: false, capitalize: true },
  ];

  const handleViewLease = async () => {
    setActionError(null);
    const err = await viewLease(apartment.lease_agreement_url);
    if (err) setActionError(err);
  };

  const handleViewSignedLease = async (path: string | null) => {
    setActionError(null);
    const err = await viewSignedLease(path);
    if (err) setActionError(err);
  };

  const handleSignedLeaseUploaded = () => {
    toast.success("Signed lease saved");
    router.refresh();
  };

  const handleVacate = async () => {
    setVacating(true);
    setActionError(null);
    const result = await vacateLandlordUnit(createClient(), apartment.id);
    setVacating(false);
    if (!result.success) {
      setActionError(result.error ?? "Could not vacate this unit.");
      return;
    }
    setVacateOpen(false);
    router.refresh();
  };

  const handleRemove = async () => {
    setDeleting(true);
    setActionError(null);
    const result = await removeLandlordUnit(createClient(), apartment.id);
    setDeleting(false);
    if (!result.success) {
      setActionError(result.error ?? "Could not remove this property.");
      return;
    }
    setDeleteConfirmOpen(false);
    router.push("/landlord/properties");
  };

  const handleImagesChange = (images: { id: string; url: string; is_cover: boolean }[]) => {
    setApartment((prev) => {
      const prevById = new Map(prev.apartment_images.map((img) => [img.id, img]));
      return {
        ...prev,
        apartment_images: images.map((img) => ({
          ...img,
          url_thumb: prevById.get(img.id)?.url_thumb ?? null,
        })),
      };
    });
  };

  return (
    <div className="p-4 flex flex-col gap-4 bg-card min-h-0">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Button variant="ghost" size="sm" onPress={() => router.push("/landlord/properties")} className="gap-1.5 font-nunito w-fit">
          <ArrowLeft size={16} />
          All Properties
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold font-nunito text-card-foreground flex items-center gap-2">
                {apartment.name}
                {apartment.is_verified && <BadgeCheck size={20} className="text-primary shrink-0" />}
              </h1>
              <StatusChip size="sm" tone={STATUS_COLOR[apartment.status] ?? "neutral"} className="capitalize">
                {apartment.status}
              </StatusChip>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {buildAddress(apartment)} · {formatPesoDisplay(apartment.monthly_rent)}/month
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button size="sm" onPress={() => setEditModalOpen(true)}>
              <Pencil size={14} aria-hidden="true" /> Edit Property
            </Button>
            <Dropdown>
              <Button variant="tertiary" size="sm" aria-label="Manage property">
                <MoreHorizontal size={16} aria-hidden="true" /> Manage
              </Button>
              <Dropdown.Popover>
                <Dropdown.Menu
                  onAction={(key) => {
                    if (key === "edit-image") setImagesModalOpen(true);
                    if (key === "view-lease") void handleViewLease();
                    if (key === "edit-lease" || key === "upload-lease") setLeaseModalOpen(true);
                  }}
                >
                  <Dropdown.Item id="edit-image" textValue="Edit images">
                    <Label>Edit Images</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="view-lease" textValue="View lease agreement" isDisabled={!apartment.lease_agreement_url || viewingLease}>
                    <Label>{viewingLease ? "Opening Lease…" : "View Lease Agreement"}</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id={apartment.lease_agreement_url ? "edit-lease" : "upload-lease"} textValue="Lease">
                    <Label>{apartment.lease_agreement_url ? "Edit Lease" : "Upload Lease"}</Label>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="flex flex-col rounded-xl border border-border bg-card py-3 px-4">
          <p className="text-sm font-medium text-red-600">{actionError}</p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon, primary, capitalize }) => (
          <div
            key={label}
            className={`p-4 flex flex-col gap-3 rounded-xl ${
              primary ? "bg-primary text-white" : "bg-card border border-border"
            }`}
          >
            <div className="flex gap-3 items-center">
              <div className={`p-1.5 rounded-md ${primary ? "bg-white/20" : "bg-muted"}`}>
                <Icon className={primary ? "text-white" : "text-primary"} size={18} />
              </div>
              <h2 className="text-base font-medium font-nunito">{label}</h2>
            </div>
            <p className={`text-3xl font-semibold font-nunito ${capitalize ? "capitalize" : ""}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid gap-4 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 flex flex-col gap-4 min-w-0">
          {/* Photos */}
          <PropertyPhotoGallery key={apartment.id} name={apartment.name} images={apartment.apartment_images} />

          {/* Unit details */}
          <Card className="shadow-none bg-card rounded-3xl border border-border p-4 md:p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <House size={18} className="text-primary" />
              </span>
              <p className="text-xs font-nunito font-semibold text-muted-foreground uppercase tracking-wide">
                Unit Details
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <DetailField label="Bedrooms" value={apartment.no_bedrooms} />
              <DetailField label="Bathrooms" value={apartment.no_bathrooms} />
              <DetailField label="Area (sqm)" value={apartment.area_sqm} />
              <DetailField label="Max Occupants" value={apartment.max_occupants} />
              <DetailField label="Type" value={apartment.type} />
              <DetailField label="Furnishing" value={apartment.furnished_type} />
              <DetailField label="Floor Level" value={apartment.floor_level} />
              <DetailField label="Lease Duration" value={apartment.lease_duration} />
            </div>
            <div className="rounded-2xl bg-muted px-4 py-3 flex items-center justify-between gap-2">
              <p className="text-xs font-nunito font-semibold text-muted-foreground uppercase tracking-wide">
                Total Move-in
              </p>
              <p className="text-base font-nunito font-bold text-primary">
                {formatPesoDisplay(totalMoveIn)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DetailField label="Monthly Rent" value={formatPesoDisplay(apartment.monthly_rent)} />
              <DetailField
                label="Security Deposit"
                value={apartment.security_deposit != null ? formatPesoDisplay(apartment.security_deposit) : "—"}
              />
              <DetailField
                label="Advance Rent"
                value={apartment.advance_rent != null ? formatPesoDisplay(apartment.advance_rent) : "—"}
              />
            </div>
            {amenities.length > 0 && (
              <div>
                <p className="text-xs font-nunito font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Amenities
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {amenities.map((item) => (
                    <Chip key={item.id} size="sm" variant="soft">
                      {item.perk?.name}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link href={`/landlord/properties/${apartment.id}/description`} className="no-underline">
                <Button className="w-full">View Full Description</Button>
              </Link>
              <Link href={`/landlord/properties/${apartment.id}/reviews`} className="no-underline">
                <Button variant="secondary" className="w-full">View Reviews</Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Side column */}
        <div className="flex flex-col gap-4 min-w-0">
          {isOccupied ? (
            <>
              {tenant && (
                <Card className="shadow-none bg-card rounded-3xl border border-border p-4 md:p-5 flex flex-col gap-3">
                  <p className="text-xs font-nunito font-semibold text-muted-foreground uppercase tracking-wide">
                    Tenant Information
                  </p>
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      src={tenant.avatarUrl}
                      initials={getInitials(tenant.fullName)}
                      alt={tenant.fullName}
                      size="md"
                      className="shrink-0 bg-primary text-white"
                      fallbackClassName="bg-primary text-white"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-nunito font-semibold text-card-foreground truncate">
                        {tenant.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {tenant.email} · {tenant.mobileNumber}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <DetailField label="Lease Start" value={formatLeaseDate(tenant.leaseStart)} />
                    <DetailField label="Lease End" value={formatLeaseDate(tenant.leaseEnd)} />
                  </div>

                  {/* Executed contract: private bucket, one file per tenancy. */}
                  <div className="flex flex-col gap-2 rounded-2xl border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-nunito font-semibold text-muted-foreground uppercase tracking-wide">
                        Signed Lease
                      </p>
                      <StatusChip size="sm" tone={SIGNED_LEASE_CHIP_COLOR[tenantLeaseStatus]}>
                        {SIGNED_LEASE_LABEL[tenantLeaseStatus]}
                      </StatusChip>
                    </div>
                    <p className="text-xs text-muted-foreground">{signedLeaseHint(tenant)}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 justify-center font-nunito"
                        onPress={() => setSignedLeaseOpen(true)}
                      >
                        <FileUp size={14} />
                        {tenant.signedLeasePath ? "Replace" : "Upload"}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1 justify-center font-nunito"
                        isDisabled={!tenant.signedLeasePath || viewingSignedLease}
                        onPress={() => void handleViewSignedLease(tenant.signedLeasePath)}
                      >
                        <FileText size={14} />
                        View
                      </Button>
                    </div>
                  </div>

                  <Link href="/landlord/messages" className="no-underline">
                    <Button variant="outline" size="sm" className="w-full justify-center font-nunito">
                      <MessageCircle size={14} />
                      Message Tenant
                    </Button>
                  </Link>
                </Card>
              )}

              {detail.maintenanceRequest && (
                <Card className="shadow-none bg-card rounded-3xl border border-border p-4 md:p-5 flex flex-col gap-3">
                  <p className="text-xs font-nunito font-semibold text-muted-foreground uppercase tracking-wide">
                    Maintenance
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Wrench size={16} className="text-primary" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-nunito font-semibold text-card-foreground truncate">
                        {detail.maintenanceRequest.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Reported {detail.maintenanceRequest.reportedDate}
                      </p>
                    </div>
                    <Link href={`/landlord/maintenance-requests/${detail.maintenanceRequest.id}`} className="shrink-0">
                      <Button size="sm" variant="ghost">
                        View <ChevronRight size={14} />
                      </Button>
                    </Link>
                  </div>
                </Card>
              )}

              {detail.recentPayments.length > 0 && (
                <Card className="shadow-none bg-card rounded-3xl border border-border p-4 md:p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-nunito font-semibold text-muted-foreground uppercase tracking-wide">
                      Recent Rent Payments
                    </p>
                    <Link href={`/landlord/properties/${apartment.id}/payment-history`} className="text-xs font-medium text-primary hover:underline no-underline">
                      View all
                    </Link>
                  </div>
                  <div className="flex flex-col gap-2">
                    {detail.recentPayments.slice(0, 3).map((p) => (
                      <Link key={p.id} href={`/landlord/payments/${p.id}`} className="no-underline">
                        <div className="flex items-center justify-between gap-2 rounded-2xl border border-border px-3 py-2.5 hover:border-primary/40 transition-colors">
                          <div className="min-w-0">
                            <p className="text-sm font-nunito font-semibold text-card-foreground truncate">{p.month}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.paidDate} · {methodLabel(p.method)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-nunito font-bold text-primary">{formatPesoDisplay(p.amount)}</p>
                            <StatusChip size="sm" tone={statusVariant(paymentStatusLabel(p.status))}>
                              {paymentStatusLabel(p.status)}
                            </StatusChip>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </Card>
              )}
            </>
          ) : (
            <Card className="shadow-none bg-card rounded-3xl border border-dashed border-border p-8 flex flex-col items-center gap-3 text-center">
              <p className="font-nunito font-semibold text-card-foreground">This property is currently vacant.</p>
              <p className="text-sm text-muted-foreground">Review applications to fill this unit.</p>
              <Link href="/landlord/applications" className="no-underline">
                <Button size="sm" variant="secondary">View Applications</Button>
              </Link>
            </Card>
          )}

          {/* Lifecycle actions */}
          <Card className="shadow-none bg-card rounded-3xl border border-border p-4 md:p-5 flex flex-col gap-2">
            <p className="text-xs font-nunito font-semibold text-muted-foreground uppercase tracking-wide">
              Property Actions
            </p>
            {isOccupied && (
              <div className="flex flex-col gap-2 pb-4">
                <p className="text-sm text-muted-foreground">End the current tenancy and make this unit available.</p>
                <Button variant="secondary" size="sm" className="w-full" onPress={() => setVacateOpen(true)}>
                  Vacate Unit
                </Button>
              </div>
            )}
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">Remove this property from your listings. You will be asked to confirm.</p>
              <Button variant="danger-soft" size="sm" className="w-full" onPress={() => setDeleteConfirmOpen(true)}>
                <Trash2 size={14} aria-hidden="true" /> Remove Property
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Modals (reused) */}
      <ApartmentImagesModal
        isOpen={imagesModalOpen}
        onClose={() => setImagesModalOpen(false)}
        apartmentId={apartment.id}
        images={apartment.apartment_images.map((img) => ({ id: img.id, url: img.url, is_cover: img.is_cover ?? false }))}
        onImagesChange={handleImagesChange}
      />
      <LeaseAgreementModal
        isOpen={leaseModalOpen}
        onClose={() => setLeaseModalOpen(false)}
        apartmentId={apartment.id}
        currentUrl={apartment.lease_agreement_url}
        onUpdated={(newUrl) => setApartment((prev) => ({ ...prev, lease_agreement_url: newUrl }))}
      />
      {tenant && (
        <SignedLeaseModal
          isOpen={signedLeaseOpen}
          onClose={() => setSignedLeaseOpen(false)}
          tenancyId={tenant.tenancyId}
          currentPath={tenant.signedLeasePath}
          uploadedAt={tenant.signedLeaseUploadedAt}
          acknowledgedAt={tenant.tenantAcknowledgedAt}
          onUploaded={handleSignedLeaseUploaded}
        />
      )}
      <DescriptionModal
        isOpen={descriptionModalOpen}
        onClose={() => setDescriptionModalOpen(false)}
        description={apartment.description}
      />
      <AmenitiesModal
        isOpen={amenitiesModalOpen}
        onClose={() => setAmenitiesModalOpen(false)}
        amenityIds={apartment.amenities}
      />
      <EditPropertyModal
        isOpen={editModalOpen}
        property={property}
        onClose={() => setEditModalOpen(false)}
        onSaved={(updated) => {
          setApartment((prev) => ({
            ...prev,
            ...updated,
            apartment_images: prev.apartment_images,
            is_verified: prev.is_verified,
            landlord_id: prev.landlord_id,
            average_rating: prev.average_rating,
            no_ratings: prev.no_ratings,
          }));
          setEditModalOpen(false);
        }}
      />
      <DeletePropertyModal
        isOpen={deleteConfirmOpen}
        propertyName={apartment.name}
        isDeleting={deleting}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => void handleRemove()}
      />

      <Modal.Root state={vacateState}>
        <Modal.Backdrop>
          <Modal.Container placement="center" size="sm">
            <Modal.Dialog className="rounded-2xl">
              <Modal.Header className="text-base font-nunito font-semibold">Vacate Unit</Modal.Header>
              <Modal.Body>
                <p className="text-sm font-nunito text-muted-foreground">
                  Mark this unit as vacant? The current tenant&apos;s lease will be ended and the unit will be listed as available.
                </p>
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onPress={() => setVacateOpen(false)} className="rounded-full font-nunito">
                  Cancel
                </Button>
                <Button size="sm" onPress={() => void handleVacate()} isDisabled={vacating} className="rounded-full font-nunito">
                  {vacating ? "Vacating…" : "Vacate"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal.Root>
    </div>
  );
}

