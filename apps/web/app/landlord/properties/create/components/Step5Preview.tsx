"use client";
import { useMemo } from "react";
import dynamic from "next/dynamic";

import { Card } from "@heroui/react";

import {
  IconArrowsMaximize,
  IconArmchair,
  IconBath,
  IconBed,
  IconBuilding,
  IconCalendar,
  IconHome,
  IconMapPin,
  IconStar,
  IconSquareCheck,
  IconUsers,
} from "@tabler/icons-react";

import ImageHeader from "../../../../browse/[apartmentId]/components/ImageHeader";
import ExpandableDescription from "../../../../browse/[apartmentId]/components/ExpandableDescription";
import Amenities from "../../../../browse/[apartmentId]/components/Amenities";
import LandlordCard from "../../../../browse/[apartmentId]/components/LandlordCard";
import PriceCard from "../../../../browse/[apartmentId]/components/PriceCard";
import LeaseAgreementCard from "../../../../browse/[apartmentId]/components/LeaseAgreementCard";
import RatingBreakdown from "../../../../browse/[apartmentId]/components/RatingBreakdown";

import type { ApartmentFormData } from "../page";

// Dynamically imported — Google Maps requires a browser environment (no SSR)
const GoogleMapPreview = dynamic(() => import("../../components/GoogleMapPicker"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 rounded-3xl bg-muted animate-pulse border border-border" />
  ),
});

interface Props {
  formData: ApartmentFormData;
  landlord?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default function Step5Preview({ formData, landlord }: Props) {
  const landlordName = [landlord?.first_name, landlord?.last_name].filter(Boolean).join(" ") || "Your landlord profile";
  // Blob URLs stay alive for the life of this step (no revocation: the
  // gallery's lazy thumbnails may still be loading after a re-render).
  const imageUrls = useMemo(() => {
    const files = [formData.thumbnail, ...formData.additionalPhotos].filter(
      (f): f is File => f !== null,
    );
    return files.map((f) => URL.createObjectURL(f));
  }, [formData.thumbnail, formData.additionalPhotos]);

  const fullAddress = [
    formData.street_address,
    formData.barangay,
    formData.city,
    formData.province,
    formData.zip_code,
  ]
    .filter(Boolean)
    .join(", ");

  const monthlyRent = Number.isFinite(formData.monthly_rent) ? formData.monthly_rent : 0;
  const securityDepositAmount = formData.security_deposit_months * monthlyRent;
  const advanceRentAmount = formData.advance_rent_months * monthlyRent;

  const stats = [
    { icon: IconHome, label: formData.type || "—" },
    { icon: IconBed, label: `${formData.no_bedrooms} Bedroom${formData.no_bedrooms !== 1 ? "s" : ""}` },
    { icon: IconBath, label: `${formData.no_bathrooms} Bathroom${formData.no_bathrooms !== 1 ? "s" : ""}` },
    { icon: IconArrowsMaximize, label: `${formData.area_sqm} sqm` },
    { icon: IconBuilding, label: formData.floor_level || "—" },
    { icon: IconUsers, label: `${formData.max_occupants ?? "—"} Occupant${formData.max_occupants !== 1 ? "s" : ""}` },
    { icon: IconCalendar, label: formData.lease_duration || "—" },
    { icon: IconArmchair, label: formData.furnished_type || "—" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2">
        <h2 className="text-2xl font-bold font-nunito text-primary mb-1">
          Preview
        </h2>
        <p className="text-muted-foreground text-sm">
          This is exactly what tenants will see when browsing your listing.
        </p>
      </div>

      <section aria-label="Listing photos" className="min-w-0">
        <div>
          <ImageHeader imageUrl={imageUrls} thumbnailUrl={imageUrls} name={formData.name || "Untitled Listing"} layout="sidebar-aligned" />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-3">
          <Card aria-label="Property details" className="create-listing-preview-card">
            <div className="min-w-0 space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-primary break-words">
                {formData.name || "Untitled Listing"}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground break-words">
                {fullAddress || "No address provided"}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map(({ icon: Icon, label }) => (
                <div key={label} className="flex min-w-0 items-center gap-2 p-3">
                  <Icon size={22} className="text-muted-foreground shrink-0" aria-hidden="true" />
                  <p className="font-nunito text-sm font-semibold text-foreground min-w-0 break-words">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card aria-label="Apartment description" className="create-listing-preview-card">
            <ExpandableDescription
              text={formData.description}
              headingIcon={<IconBuilding size={26} className="shrink-0 text-foreground" aria-hidden="true" />}
            />
          </Card>

          <Card aria-label="Apartment amenities" className="create-listing-preview-card">
            <Amenities
              apartmentPerks={formData.amenities}
              headingIcon={<IconSquareCheck size={26} className="shrink-0 text-foreground" aria-hidden="true" />}
            />
          </Card>

          <Card aria-label="Apartment location" className="create-listing-preview-card">
            <div className="flex items-center gap-2">
              <IconMapPin size={24} className="shrink-0 text-foreground" aria-hidden="true" />
              <h3>Location</h3>
            </div>
            <GoogleMapPreview
              latitude={formData.latitude}
              longitude={formData.longitude}
              readOnly
              showHeader={false}
            />
          </Card>
          <Card aria-label="Ratings and reviews" className="create-listing-preview-card">
            <div className="flex items-center gap-2">
              <IconStar size={24} className="shrink-0 text-foreground" aria-hidden="true" />
              <h3>Ratings &amp; Reviews</h3>
            </div>
            <div className="create-listing-preview-ratings">
              <RatingBreakdown overallRate={0} totalReviews={0} no5Star={0} no4Star={0} no3Star={0} no2Star={0} no1Star={0} />
            </div>
            <div className="py-6 text-center">
              <p className="font-nunito font-semibold text-foreground">No ratings or reviews yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Reviews will appear here after tenants share their experiences.
              </p>
            </div>
          </Card>
        </div>

        <aside className="flex min-w-0 flex-col gap-3" aria-label="Preview pricing and landlord">
            <PriceCard
              price={monthlyRent}
              securityDeposit={securityDepositAmount}
              advancePayment={advanceRentAmount}
              isPreview
              className="create-listing-preview-card create-listing-preview-boxed"
            />
            <LeaseAgreementCard
              leaseDetailsUrl=""
              localFile={formData.lease_agreement}
              className="create-listing-preview-card create-listing-preview-boxed"
            />
            <LandlordCard
              className="create-listing-preview-card create-listing-preview-boxed"
              name={landlordName}
              avatarUrl={landlord?.avatar_url}
              showMessageButton={false}
            />
        </aside>
      </div>
    </div>
  );
}
