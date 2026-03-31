"use client";
import { useMemo } from "react";
import dynamic from "next/dynamic";
import { Divider, Button, Card, CardHeader, CardBody, CardFooter } from "@heroui/react";
import { formatCurrency } from "@repo/utils";
import { House, BedDouble, Bath, Expand, Flag, Users, Layers, CalendarClock, Armchair } from "lucide-react";
import { PERKS } from "../../../../components/inputs/perks";
import type { ApartmentFormData } from "../page";
import NextImage from "next/image";

// Dynamically imported — Leaflet requires a browser environment (no SSR)
const MapPreview = dynamic(() => import("./MapPreview"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-56 rounded-2xl bg-grey-100 animate-pulse border border-grey-200" />
  ),
});

interface Props {
  formData: ApartmentFormData;
}

function PreviewImageHeader({ files }: { files: (File | null)[] }) {
  const urls = useMemo(() => {
    return files
      .filter((f): f is File => f !== null)
      .map((f) => URL.createObjectURL(f));
  }, [files]);

  const fallback = "/default/default-thumbnail.jpeg";
  const img0 = urls[0] ?? fallback;
  const img1 = urls[1] ?? fallback;
  const img2 = urls[2] ?? fallback;

  return (
    <div className="w-full h-96 flex gap-4 rounded-2xl overflow-hidden">
      {/* Main large image */}
      <div className="w-2/3 overflow-hidden relative">
        <NextImage src={img0} alt="Cover" fill className="object-cover" />
      </div>
      {/* Side thumbnails */}
      <div className="w-1/3 flex flex-col gap-4">
        <div className="flex-1 overflow-hidden relative">
          <NextImage src={img1} alt="Photo 2" fill className="object-cover" />
        </div>
        <div className="flex-1 relative overflow-hidden">
          <NextImage src={img2} alt="Photo 3" fill className="object-cover" />
          {urls.length > 3 && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                +{urls.length - 3} more
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



export default function Step5Preview({ formData }: Props) {
  const allFiles: (File | null)[] = [
    formData.thumbnail,
    ...formData.additionalPhotos,
  ];

  const fullAddress = [
    formData.street_address,
    formData.barangay,
    formData.city,
    formData.province,
    formData.zip_code,
  ]
    .filter(Boolean)
    .join(", ");

  const amenityList = formData.amenities
    .map((id) => PERKS[id])
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2">
        <h2 className="text-2xl font-medium font-noto-serif text-primary mb-1">
          Preview
        </h2>
        <p className="text-grey-500 text-sm">
          This is exactly what tenants will see when browsing your listing.
        </p>
      </div>

      <div className="rounded-2xl border border-grey-200 p-6 flex flex-col gap-6 bg-white">
        {/* Image Header */}
        <PreviewImageHeader files={allFiles} />

        {/* Content */}
        <div className="w-full flex gap-5">
          {/* Left column — 2/3 */}
          <div className="w-2/3 flex flex-col">
            {/* Name & Address */}
            <div>
              <h1 className="text-3xl font-medium font-noto-serif text-primary">
                {formData.name || (
                  <span className="text-grey-300">Untitled Listing</span>
                )}
              </h1>
              <h3 className="text-grey-600 mt-1 text-sm">
                {fullAddress || (
                  <span className="text-grey-300">No address provided</span>
                )}
              </h3>
            </div>

            {/* Quick stats grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-4">
              {[
                { icon: House, label: formData.type || "—" },
                { icon: BedDouble, label: `${formData.no_bedrooms} Bedroom${formData.no_bedrooms !== 1 ? "s" : ""}` },
                { icon: Bath, label: `${formData.no_bathrooms} Bathroom${formData.no_bathrooms !== 1 ? "s" : ""}` },
                { icon: Expand, label: `${formData.area_sqm} sqm` },
                { icon: Users, label: `Max ${formData.max_occupants ?? "—"} Occupant${formData.max_occupants !== 1 ? "s" : ""}` },
                { icon: Layers, label: formData.floor_level ? `Floor ${formData.floor_level}` : "—" },
                { icon: CalendarClock, label: formData.lease_duration || "—" },
                { icon: Armchair, label: formData.furnished_type || "—" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex gap-2 items-center">
                  <Icon size={20} className="text-grey-700 shrink-0" />
                  <span className="text-sm font-medium text-grey-700">{label}</span>
                </div>
              ))}
            </div>

            <Divider className="my-6" />

            {/* Description */}
            <div>
              <h3 className="text-lg font-medium mb-2">Description</h3>
              <p className="text-grey-700 whitespace-pre-line text-sm leading-relaxed">
                {formData.description || (
                  <span className="text-grey-300">No description yet.</span>
                )}
              </p>
            </div>

            {/* Amenities */}
            {amenityList.length > 0 && (
              <>
                <Divider className="my-6" />
                <div>
                  <h3 className="text-lg font-medium mb-3">Amenities</h3>
                  <ul className="grid grid-cols-2 gap-3">
                    {amenityList.map((perk) => {
                      if (!perk) return null;
                      const Icon = perk.icon;
                      return (
                        <li key={perk.id} className="flex items-center gap-2">
                          <Icon size={20} className="text-primary shrink-0" />
                          <span className="text-base">{perk.name}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </>
            )}

            {/* Map */}
            <Divider className="my-6" />
            <div>
              <h3 className="text-lg font-medium mb-3">Location</h3>
              <MapPreview
                latitude={formData.latitude}
                longitude={formData.longitude}
                address={fullAddress}
              />
            </div>
          </div>

          {/* Right column — price card */}
          <div className="w-1/3 flex flex-col gap-5">
            <Card
              shadow="none"
              classNames={{ base: "border border-grey-300" }}
            >
              <CardHeader>
                <h2 className="text-3xl font-noto-serif font-medium text-primary">
                  ₱ {formatCurrency(formData.monthly_rent)}
                  <span className="text-xl">/month</span>
                </h2>
              </CardHeader>
              <CardBody>
                <div className="flex flex-col gap-3 bg-darker-white p-4 rounded-lg">
                  {/* Header */}
                  <span className="text-sm font-semibold text-grey-800">
                    Estimated Move-in Cost
                  </span>

                  {/* Rows */}
                  {[
                    { label: "Monthly Rent", amount: formData.monthly_rent },
                    { label: "Security Deposit", amount: formData.security_deposit },
                    { label: "Advance Rent", amount: formData.monthly_rent },
                  ].map(({ label, amount }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-grey-500">{label}</span>
                      <span className="font-medium">₱ {formatCurrency(amount)}</span>
                    </div>
                  ))}

                  {/* Divider + Total */}
                  <Divider />
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-grey-800">Total</span>
                    <span className="font-bold text-primary">
                      ₱ {formatCurrency(
                        formData.monthly_rent +
                        formData.security_deposit +
                        formData.monthly_rent
                      )}
                    </span>
                  </div>
                </div>
              </CardBody>
              <CardFooter className="flex flex-col gap-2">
                <Button
                  variant="solid"
                  radius="full"
                  color="primary"
                  fullWidth
                  isDisabled
                >
                  Apply Now
                </Button>
                <Button
                  variant="light"
                  radius="full"
                  color="danger"
                  fullWidth
                  isDisabled
                  startContent={<Flag size={16} />}
                >
                  Report
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
