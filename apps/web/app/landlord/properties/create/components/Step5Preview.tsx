"use client";
import { useMemo } from "react";
import dynamic from "next/dynamic";

import { formatPesoDisplay } from "@repo/utils";

import { Separator, Button, Card } from "@heroui/react";

import {
  IconArrowsMaximize,
  IconArmchair,
  IconBath,
  IconBed,
  IconBuilding,
  IconCalendar,
  IconFlag,
  IconHome,
  IconUsers,
} from "@tabler/icons-react";

import ImageHeader from "../../../../browse/[apartmentId]/components/ImageHeader";
import ExpandableDescription from "../../../../browse/[apartmentId]/components/ExpandableDescription";
import Amenities from "../../../../browse/[apartmentId]/components/Amenities";

import type { ApartmentFormData } from "../page";

// Dynamically imported — Google Maps requires a browser environment (no SSR)
const GoogleMapPreview = dynamic(() => import("../../components/GoogleMapPicker"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 rounded-2xl bg-muted animate-pulse border border-border" />
  ),
});

interface Props {
  formData: ApartmentFormData;
}

export default function Step5Preview({ formData }: Props) {
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

  const securityDepositAmount = formData.security_deposit_months * formData.monthly_rent;
  const advanceRentAmount = formData.advance_rent_months * formData.monthly_rent;
  const totalMoveInCost = formData.monthly_rent + securityDepositAmount + advanceRentAmount;

  const costBreakdown = [
    { label: "Monthly Rent", value: formatPesoDisplay(formData.monthly_rent) },
    { label: "Security Deposit", value: formatPesoDisplay(securityDepositAmount) },
    { label: "Advance Payment", value: formatPesoDisplay(advanceRentAmount) },
  ];

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
        <h2 className="text-2xl font-medium font-noto-serif text-primary mb-1">
          Preview
        </h2>
        <p className="text-muted-foreground text-sm">
          This is exactly what tenants will see when browsing your listing.
        </p>
      </div>

      <div className="rounded-2xl border border-border p-6 flex flex-col gap-6 bg-card">
        <div className="my-4">
          <ImageHeader imageUrl={imageUrls} thumbnailUrl={imageUrls} name={formData.name || "Untitled Listing"} />
        </div>

        {/* Content */}
        <div className="w-full flex flex-col lg:flex-row gap-8 lg:gap-5 min-w-0">
          {/* Left column — 2/3 */}
          <div className="w-full lg:w-2/3 min-w-0">
            {/* Name & Address */}
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-medium text-primary break-words">
                {formData.name || "Untitled Listing"}
              </h1>
              <h3 className="text-sm sm:text-base text-foreground/80 break-words">
                {fullAddress || "No address provided"}
              </h3>
            </div>

            {/* Quick stats grid */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4 sm:gap-6 mt-6 min-w-0">
              {stats.map(({ icon: Icon, label }) => (
                <div key={label} className="flex gap-2 items-center min-w-0">
                  <Icon size={22} className="text-grey-700 shrink-0" />
                  <h2 className="text-sm sm:text-base font-medium text-grey-700 min-w-0 break-words">
                    {label}
                  </h2>
                </div>
              ))}
            </div>

            <Separator className="my-6 sm:my-8" />

            <ExpandableDescription text={formData.description} />

            <Separator className="my-6 sm:my-8" />

            <Amenities apartmentPerks={formData.amenities} />

            <Separator className="my-6 sm:my-8" />

            <div>
              <h3 className="text-lg font-medium mb-2">View on Map</h3>
              <GoogleMapPreview
                latitude={formData.latitude}
                longitude={formData.longitude}
                readOnly
                showHeader={false}
              />
            </div>
          </div>

          {/* Right column — 1/3 */}
          <div className="w-full lg:w-1/3 min-w-0 flex flex-col gap-4 sm:gap-5">
            <Card className="border border-border shadow-none w-full">
              <Card.Header>
                <Card.Title className="text-2xl sm:text-3xl font-medium text-primary">
                  {formatPesoDisplay(formData.monthly_rent)}<span className="text-base sm:text-xl">/month</span>
                </Card.Title>
              </Card.Header>

              <Card.Content>
                <div className="flex flex-col gap-3 bg-muted p-4 rounded-lg">
                  {costBreakdown.map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-foreground">{value}</span>
                    </div>
                  ))}

                  <Separator />

                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">Total Move-in Cost:</span>
                    <span className="font-medium text-foreground">{formatPesoDisplay(totalMoveInCost)}</span>
                  </div>
                </div>
              </Card.Content>

              <Card.Footer className="flex flex-col gap-2">
                <Button fullWidth isDisabled>
                  Apply Now
                </Button>
                <Button
                  variant="tertiary"
                  className="bg-red-400/10 text-red-600 border-red-300 hover:bg-red-400/20"
                  fullWidth
                  isDisabled
                >
                  <IconFlag size={16} />
                  Report
                </Button>
              </Card.Footer>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
