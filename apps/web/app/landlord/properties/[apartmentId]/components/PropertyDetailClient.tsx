"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Dropdown,
  Label,
  Modal,
  useOverlayState,
} from "@heroui/react";
import {
  ArrowLeft,
  BadgeCheck,
  Star,
  FileText,
  Pencil,
  MoreHorizontal,
  Trash2,
  MessageCircle,
  Wrench,
  Banknote,
  ChevronRight,
  CircleCheck,
  House,
} from "lucide-react";
import { formatPesoDisplay } from "@repo/utils";
import { createClient } from "@repo/supabase/browser";
import {
  formatLeaseDate,
  methodLabel,
  paymentStatusLabel,
  statusVariant,
} from "@/app/tenant/payment/utils";
import {
  removeLandlordUnit,
  vacateLandlordUnit,
  type LandlordUnitApartment,
  type LandlordUnitDetail,
} from "@/service/landlordUnitDetailService";
import { toProperty } from "./to-property";
import { useLeaseViewer } from "./use-lease-viewer";
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
  const { viewLease, viewing: viewingLease } = useLeaseViewer();

  const property = toProperty(apartment);
  const isOccupied = apartment.status === "occupied";
  const extraImages = apartment.apartment_images.filter((img) => !img.is_cover);
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
              <Chip size="sm" variant="soft" color={STATUS_COLOR[apartment.status] ?? "default"} className="capitalize">
                {apartment.status}
              </Chip>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {buildAddress(apartment)} · {formatPesoDisplay(apartment.monthly_rent)}/month
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button isIconOnly variant="ghost" size="sm" onPress={() => setEditModalOpen(true)} aria-label="Edit property">
              <Pencil size={14} />
            </Button>
            <Button isIconOnly variant="ghost" size="sm" onPress={() => void handleViewLease()} isDisabled={!apartment.lease_agreement_url || viewingLease} aria-label="View lease">
              <FileText size={14} />
            </Button>
            <Dropdown>
              <Button isIconOnly variant="tertiary" size="sm" aria-label="More actions">
                <MoreHorizontal size={16} />
              </Button>
              <Dropdown.Popover>
                <Dropdown.Menu
                  onAction={(key) => {
                    if (key === "edit-image") setImagesModalOpen(true);
                    if (key === "edit-lease" || key === "upload-lease") setLeaseModalOpen(true);
                    if (key === "delete") setDeleteConfirmOpen(true);
                  }}
                >
                  <Dropdown.Item id="edit-image" textValue="Edit images">
                    <Label>Edit Images</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id={apartment.lease_agreement_url ? "edit-lease" : "upload-lease"} textValue="Lease">
                    <Label>{apartment.lease_agreement_url ? "Edit Lease" : "Upload Lease"}</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="delete" textValue="Delete" variant="danger">
                    <Label>Delete</Label>
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
          <Card className="shadow-none bg-card rounded-3xl border border-border overflow-hidden">
            <div className="relative h-64 sm:h-80 w-full">
              <Image
                src={property.thumbnail}
                alt={apartment.name}
                fill
                className="object-cover"
              />
            </div>
            {extraImages.length > 0 && (
              <Card.Content className="p-4">
                <div className="grid grid-cols-4 gap-2">
                  {extraImages.slice(0, 4).map((img) => (
                    <div key={img.id} className="relative h-20 rounded-xl overflow-hidden">
                      <Image src={img.url_thumb || img.url} alt={apartment.name} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </Card.Content>
            )}
          </Card>

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
              {detail.tenant && (
                <Card className="shadow-none bg-card rounded-3xl border border-border p-4 md:p-5 flex flex-col gap-3">
                  <p className="text-xs font-nunito font-semibold text-muted-foreground uppercase tracking-wide">
                    Tenant Information
                  </p>
                  <div className="flex items-center gap-3">
                    <Avatar size="md" className="shrink-0">
                      <Avatar.Fallback className="bg-primary text-white">
                        {getInitials(detail.tenant.fullName)}
                      </Avatar.Fallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-nunito font-semibold text-card-foreground truncate">
                        {detail.tenant.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {detail.tenant.email} · {detail.tenant.mobileNumber}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <DetailField label="Lease Start" value={formatLeaseDate(detail.tenant.leaseStart)} />
                    <DetailField label="Lease End" value={formatLeaseDate(detail.tenant.leaseEnd)} />
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
                            <Chip size="sm" variant="soft" color={statusVariant(paymentStatusLabel(p.status))}>
                              {paymentStatusLabel(p.status)}
                            </Chip>
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
              <Button variant="secondary" size="sm" className="w-full" onPress={() => setVacateOpen(true)}>
                Vacate Unit
              </Button>
            )}
            <Button variant="danger-soft" size="sm" className="w-full" onPress={() => setDeleteConfirmOpen(true)}>
              <Trash2 size={14} /> Remove Property
            </Button>
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
