"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Chip } from "@heroui/react";
import { ArrowLeft, FileText, Pencil, Upload } from "lucide-react";
import { formatPesoDisplay } from "@repo/utils";
import { formatLeaseDate } from "@/app/tenant/payment/utils";
import type { LandlordUnitDetail } from "@/service/landlordUnitDetailService";
import { toProperty } from "../../components/to-property";
import { useLeaseViewer } from "../../components/use-lease-viewer";
import { PERKS } from "@/app/components/inputs/perks";
import LeaseAgreementModal from "../../../components/modals/LeaseAgreementModal";
import DescriptionModal from "../../../components/modals/DescriptionModal";
import AmenitiesModal from "../../../components/modals/AmenitiesModal";
import EditPropertyModal from "../../../components/modals/EditPropertyModal";

function ReadOnlyField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-sm font-nunito text-muted-foreground">{label}</p>
      <p className="text-[15px] font-nunito font-semibold text-card-foreground leading-snug">
        {value ?? "—"}
      </p>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="text-sm font-nunito font-bold text-primary uppercase tracking-wide">{children}</p>
  );
}

export default function DescriptionClient({ detail }: { detail: LandlordUnitDetail }) {
  const router = useRouter();
  const [apartment, setApartment] = useState(detail.apartment);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [leaseModalOpen, setLeaseModalOpen] = useState(false);
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [amenitiesModalOpen, setAmenitiesModalOpen] = useState(false);
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
        <Button variant="ghost" size="sm" onPress={() => router.push(`/landlord/properties/${apartment.id}`)} className="gap-1.5 font-nunito w-fit">
          <ArrowLeft size={16} />
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

      {/* Main information */}
      <Card className="shadow-none bg-card rounded-3xl border border-border p-4 md:p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <SectionTitle>Main Information</SectionTitle>
          <Button isIconOnly variant="ghost" size="sm" onPress={() => setEditModalOpen(true)} aria-label="Edit main information">
            <Pencil size={14} />
          </Button>
        </div>
        <div>
          <p className="text-lg font-nunito font-semibold text-card-foreground">{apartment.name}</p>
          <p className="text-sm text-muted-foreground">{fullAddress || "—"}</p>
        </div>
        {detail.tenant && (
          <div className="grid grid-cols-2 gap-3">
            <ReadOnlyField label="Lease Start" value={formatLeaseDate(detail.tenant.leaseStart)} />
            <ReadOnlyField label="Lease End" value={formatLeaseDate(detail.tenant.leaseEnd)} />
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <ReadOnlyField label="Monthly Rent" value={formatPesoDisplay(apartment.monthly_rent)} />
          <ReadOnlyField
            label="Security Deposit"
            value={apartment.security_deposit != null ? formatPesoDisplay(apartment.security_deposit) : "—"}
          />
          <ReadOnlyField
            label="Advance Rent"
            value={apartment.advance_rent != null ? formatPesoDisplay(apartment.advance_rent) : "—"}
          />
        </div>
      </Card>

      {/* Full description */}
      <Card className="shadow-none bg-card rounded-3xl border border-border p-4 md:p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <SectionTitle>Full Description</SectionTitle>
          <Button isIconOnly variant="ghost" size="sm" onPress={() => setEditModalOpen(true)} aria-label="Edit description">
            <Pencil size={14} />
          </Button>
        </div>
        <div className="rounded-2xl bg-muted px-4 py-3">
          <p className="text-[15px] font-nunito text-card-foreground leading-relaxed whitespace-pre-line">
            {apartment.description ?? "—"}
          </p>
        </div>
        {apartment.description && (
          <button
            type="button"
            onClick={() => setDescriptionModalOpen(true)}
            className="text-xs font-medium text-primary hover:underline w-fit"
          >
            View all
          </button>
        )}
      </Card>

      {/* Specs */}
      <Card className="shadow-none bg-card rounded-3xl border border-border p-4 md:p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <SectionTitle>Room / Unit Details</SectionTitle>
          <Button isIconOnly variant="ghost" size="sm" onPress={() => setEditModalOpen(true)} aria-label="Edit specs">
            <Pencil size={14} />
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ReadOnlyField label="Type" value={apartment.type} />
          <ReadOnlyField label="Lease Duration" value={apartment.lease_duration} />
          <ReadOnlyField label="Bedrooms" value={apartment.no_bedrooms} />
          <ReadOnlyField label="Bathrooms" value={apartment.no_bathrooms} />
          <ReadOnlyField label="Furnishing" value={apartment.furnished_type} />
          <ReadOnlyField label="Floor Level" value={apartment.floor_level} />
          <ReadOnlyField label="Max Occupants" value={apartment.max_occupants} />
          <ReadOnlyField label="Area (sqm)" value={apartment.area_sqm} />
        </div>
      </Card>

      {/* Perks */}
      {amenities.length > 0 && (
        <Card className="shadow-none bg-card rounded-3xl border border-border p-4 md:p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <SectionTitle>Included Perks</SectionTitle>
            <Button isIconOnly variant="ghost" size="sm" onPress={() => setEditModalOpen(true)} aria-label="Edit perks">
              <Pencil size={14} />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {amenities.map((item) => (
              <Chip key={item.id} size="sm" variant="soft">
                {item.perk?.name}
              </Chip>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setAmenitiesModalOpen(true)}
            className="text-xs font-medium text-primary hover:underline w-fit"
          >
            View all
          </button>
        </Card>
      )}

      {/* Lease */}
      <Card className="shadow-none bg-card rounded-3xl border border-border p-4 md:p-5 flex flex-col gap-2">
        <SectionTitle>Lease Agreement</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            isDisabled={!apartment.lease_agreement_url || viewing}
            onPress={() => void handleViewLease()}
          >
            <FileText size={16} /> {viewing ? "Opening…" : "View Lease Agreement"}
          </Button>
          <Button size="sm" className="w-full" onPress={() => setLeaseModalOpen(true)}>
            <Upload size={16} /> Upload Lease Agreement
          </Button>
        </div>
      </Card>

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
    </div>
  );
}
