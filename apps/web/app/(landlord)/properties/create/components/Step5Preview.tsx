"use client";
import { useMemo } from "react";
import { Divider, Button } from "@heroui/react";
import { House, BedDouble, Bath, Expand, Flag } from "lucide-react";
// Adjust this import path to match your project structure
import { PERKS } from "../../../../components/inputs/perks";
import type { ApartmentFormData } from "../page";

interface Props {
  formData: ApartmentFormData;
}

// Mirrors the ImageHeader layout from the browse detail page (static, no lightbox needed for preview)
function PreviewImageHeader({ files }: { files: (File | null)[] }) {
  // Memoize object URLs to avoid re-creating on every render
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
      <div className="w-2/3 overflow-hidden">
        <img
          src={img0}
          alt="Cover"
          className="w-full h-full object-cover"
        />
      </div>
      {/* Side thumbnails */}
      <div className="w-1/3 flex flex-col gap-4">
        <div className="flex-1 overflow-hidden">
          <img
            src={img1}
            alt="Photo 2"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 relative overflow-hidden">
          <img
            src={img2}
            alt="Photo 3"
            className="w-full h-full object-cover"
          />
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

      {/* Divider to separate meta from preview */}
      <div className="rounded-2xl border border-grey-200 p-6 flex flex-col gap-6 bg-white">
        {/* Image Header */}
        <PreviewImageHeader files={allFiles} />

        {/* Content — mirrors ApartmentDetailsPage layout */}
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

            {/* Quick stats row */}
            <div className="flex items-center justify-between gap-3 mt-4">
              <div className="flex gap-2 items-center">
                <House size={22} className="text-grey-700" />
                <span className="text-base font-medium text-grey-700">
                  {formData.type || "—"}
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <BedDouble size={22} className="text-grey-700" />
                <span className="text-base font-medium text-grey-700">
                  {formData.no_bedrooms} Bedroom
                  {formData.no_bedrooms !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <Bath size={22} className="text-grey-700" />
                <span className="text-base font-medium text-grey-700">
                  {formData.no_bathrooms} Bathroom
                  {formData.no_bathrooms !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <Expand size={22} className="text-grey-700" />
                <span className="text-base font-medium text-grey-700">
                  {formData.area_sqm} sqm
                </span>
              </div>
            </div>

            <Divider className="my-6" />

            {/* Description */}
            <div className="max-h-48 overflow-y-auto">
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
          </div>

          {/* Right column — price card (mirrors PriceCard) */}
          <div className="w-1/3 flex flex-col gap-5">
            <div className="border border-grey-300 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="px-5 pt-5 pb-3">
                <h2 className="text-3xl font-noto-serif font-medium text-primary">
                  ₱ {formData.monthly_rent.toLocaleString()}
                  <span className="text-xl">/month</span>
                </h2>
              </div>

              {/* Breakdown */}
              <div className="px-5 pb-4">
                <div className="flex flex-col gap-3 bg-grey-50 p-4 rounded-xl">
                  <div className="flex justify-between text-sm">
                    <span className="text-grey-500">Security Deposit</span>
                    <span className="font-medium">
                      ₱ {formData.security_deposit.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="px-5 pb-5 flex flex-col gap-2">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}