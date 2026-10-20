"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Chip } from "@heroui/react";
import {
  IconArrowLeft as ArrowLeft, IconFileText as FileText, IconPencil as Pencil,
  IconUpload as Upload, IconHome, IconBed, IconSparkles, IconMapPin,
  IconCalendar, IconCurrencyPeso, IconShieldCheck, IconCreditCard,
  IconBuilding, IconArmchair, IconStairs, IconUsers, IconDimensions, IconBath,
  type Icon,
} from "@tabler/icons-react";
import { formatPesoDisplay } from "@repo/utils";
import { formatLeaseDate } from "@/app/tenant/payment/utils";
import type { LandlordUnitDetail } from "@/service/landlordUnitDetailService";
import { toProperty } from "../../components/to-property";
import { useLeaseViewer } from "../../components/use-lease-viewer";
import { PERKS } from "@/app/components/inputs/perks";
import LeaseAgreementModal from "../../../components/modals/LeaseAgreementModal";
import EditPropertyModal from "../../../components/modals/EditPropertyModal";
import DescriptionSection from "./DescriptionSection";

function ReadOnlyField({ label, value, icon: Icon, highlight = false }: { label: string; value?: string | number | null; icon: Icon; highlight?: boolean }) {
  return (
    <div className={`flex min-w-0 items-center gap-3 rounded-xl px-3 py-3 ${highlight ? "bg-primary/5" : "bg-muted/40"}`}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon size={22} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-nunito font-bold text-card-foreground leading-snug wrap-break-word">
          {value ?? "—"}
        </p>
      </div>
    </div>
  );
}

function EditSectionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Button variant="secondary" size="sm" onPress={onPress} aria-label={label}>
      <Pencil size={14} aria-hidden="true" /> Edit
    </Button>
  );
}

export default function DescriptionClient({ detail }: { detail: LandlordUnitDetail }) {
  const router = useRouter();
  const [apartment, setApartment] = useState(detail.apartment);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [leaseModalOpen, setLeaseModalOpen] = useState(false);
  const { viewLease, viewing } = useLeaseViewer();

  const property = toProperty(apartment);
  const fullAddress = [apartment.street_address, apartment.barangay, apartment.city, apartment.province]
    .filter(Boolean)
    .join(", ");
  const amenities = apartment.amenities
    .map((id) => ({ id, perk: PERKS[id] }))
    .filter((item) => item.perk);

  const handleViewLease = async () => {
    setActionError(null);
    const err = await viewLease(apartment.lease_agreement_url);
    if (err) setActionError(err);
  };

  return (
    <div className="p-4 flex flex-col gap-4 bg-card min-h-0">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => router.push(`/landlord/properties/${apartment.id}`)}
          onHoverStart={() => router.prefetch(`/landlord/properties/${apartment.id}`)}
          onFocus={() => router.prefetch(`/landlord/properties/${apartment.id}`)}
          className="gap-1.5 font-nunito w-fit"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Property
        </Button>
        <h1 className="mt-2 text-2xl font-bold font-nunito text-card-foreground">Apartment Description</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Full listing details for {apartment.name}.
        </p>
      </div>

      {actionError && (
        <div className="flex flex-col rounded-xl border border-border bg-card py-3 px-4">
          <p className="text-sm font-medium text-red-600">{actionError}</p>
        </div>
      )}

      <DescriptionSection
        title="Main Information"
        subtitle="Basic details and pricing information for this property."
        icon={IconHome}
        action={<EditSectionButton label="Edit main information" onPress={() => setEditModalOpen(true)} />}
      >
        <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
          <div className="relative min-h-40 overflow-hidden rounded-xl bg-muted">
            <Image src={property.thumbnail} alt={apartment.name} fill unoptimized className="object-cover" />
          </div>
          <div className="flex min-w-0 flex-col justify-between gap-4">
            <div>
              <p className="text-lg font-nunito font-bold text-card-foreground">{apartment.name}</p>
              <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                <IconMapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{fullAddress || "—"}
              </p>
            </div>
            <div className={`grid grid-cols-1 gap-2 sm:grid-cols-2 ${detail.tenant ? "2xl:grid-cols-5" : "xl:grid-cols-3"}`}>
              {detail.tenant && (
                <>
                  <ReadOnlyField icon={IconCalendar} label="Lease Start" value={formatLeaseDate(detail.tenant.leaseStart)} />
                  <ReadOnlyField icon={IconCalendar} label="Lease End" value={formatLeaseDate(detail.tenant.leaseEnd)} />
                </>
              )}
              <ReadOnlyField icon={IconCurrencyPeso} label="Monthly Rent" value={formatPesoDisplay(apartment.monthly_rent)} highlight />
              <ReadOnlyField icon={IconShieldCheck} label="Security Deposit" value={apartment.security_deposit != null ? formatPesoDisplay(apartment.security_deposit) : "—"} />
              <ReadOnlyField icon={IconCreditCard} label="Advance Rent" value={apartment.advance_rent != null ? formatPesoDisplay(apartment.advance_rent) : "—"} />
            </div>
          </div>
        </div>
      </DescriptionSection>

      {/* Full description */}
      <DescriptionSection title="Full Description" subtitle="Detailed information about the property and its features." icon={FileText} action={<EditSectionButton label="Edit description" onPress={() => setEditModalOpen(true)} />}>
        <div className="rounded-2xl bg-muted px-4 py-3">
          <p className="text-[15px] font-nunito text-card-foreground leading-relaxed whitespace-pre-line">
            {apartment.description || "No description added yet."}
          </p>
        </div>
      </DescriptionSection>

      {/* Specs */}
      <DescriptionSection title="Room / Unit Details" subtitle="Key information about the unit specifications." icon={IconBed} action={<EditSectionButton label="Edit specs" onPress={() => setEditModalOpen(true)} />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
          <ReadOnlyField icon={IconBuilding} label="Type" value={apartment.type} />
          <ReadOnlyField icon={IconCalendar} label="Lease Duration" value={apartment.lease_duration} />
          <ReadOnlyField icon={IconBed} label="Bedrooms" value={apartment.no_bedrooms} />
          <ReadOnlyField icon={IconBath} label="Bathrooms" value={apartment.no_bathrooms} />
          <ReadOnlyField icon={IconArmchair} label="Furnishing" value={apartment.furnished_type} />
          <ReadOnlyField icon={IconStairs} label="Floor Level" value={apartment.floor_level} />
          <ReadOnlyField icon={IconUsers} label="Max Occupants" value={apartment.max_occupants} />
          <ReadOnlyField icon={IconDimensions} label="Area (sqm)" value={apartment.area_sqm} />
        </div>
      </DescriptionSection>

      {/* Perks */}
      <DescriptionSection title="Included Perks" subtitle="Amenities and features included in this unit." icon={IconSparkles} action={<EditSectionButton label="Edit perks" onPress={() => setEditModalOpen(true)} />}>
        {amenities.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {amenities.map(({ id, perk }) => {
              const PerkIcon = perk.icon;
              return (
                <Chip key={id} size="sm" variant="soft">
                  <span className="inline-flex items-center gap-1.5"><PerkIcon size={14} aria-hidden="true" />{perk.name}</span>
                </Chip>
              );
            })}
          </div>
        ) : <p className="text-sm text-muted-foreground">No perks added yet.</p>}
      </DescriptionSection>

      {/* Lease */}
      <DescriptionSection title="Lease Agreement" subtitle="View or upload this property's lease agreement." icon={FileText} inline>
        <div className="grid flex-1 grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            isDisabled={!apartment.lease_agreement_url || viewing}
            onPress={() => void handleViewLease()}
          >
            <FileText size={16} aria-hidden="true" /> {viewing ? "Opening…" : "View Lease Agreement"}
          </Button>
          <Button size="sm" className="w-full" onPress={() => setLeaseModalOpen(true)}>
            <Upload size={16} aria-hidden="true" /> Upload Lease Agreement
          </Button>
        </div>
      </DescriptionSection>

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
      <LeaseAgreementModal
        isOpen={leaseModalOpen}
        onClose={() => setLeaseModalOpen(false)}
        apartmentId={apartment.id}
        currentUrl={apartment.lease_agreement_url}
        onUpdated={(newUrl) => setApartment((prev) => ({ ...prev, lease_agreement_url: newUrl }))}
      />
    </div>
  );
}
