import type { ReactNode } from "react";
import { Card, Chip, Separator } from "@heroui/react";
import {
  Armchair,
  Bath,
  BedDouble,
  Building2,
  Calendar,
  ClipboardList,
  Coins,
  Expand,
  House,
  LayoutGrid,
  MapPin,
  PhilippinePeso,
  ReceiptText,
  Tags,
  Users,
  Wallet,
} from "lucide-react";
import { formatPesoDisplay } from "@repo/utils";
import type { Apartment, ApartmentImage, Verification } from "../types";
import ApartmentDescription from "./ApartmentDescription";
import ApartmentGallery from "./ApartmentGallery";
import ApartmentIdentity from "./ApartmentIdentity";

interface ApartmentOverviewProps {
  apartment: Apartment;
  verification: Verification | null;
  images: ApartmentImage[];
  imagesError: boolean;
}

function PropertyFact({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="mt-0.5 shrink-0 text-primary" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-nunito text-base font-semibold text-foreground wrap-break-word">
          {value}
        </p>
      </div>
    </div>
  );
}

export function ApartmentOverview({
  apartment,
  verification,
  images,
  imagesError,
}: ApartmentOverviewProps) {
  const ordered = [...images].sort(
    (a, b) => Number(Boolean(b.is_cover)) - Number(Boolean(a.is_cover)),
  );
  const hasCoordinates =
    apartment.latitude != null &&
    apartment.longitude != null &&
    Number.isFinite(apartment.latitude) &&
    Number.isFinite(apartment.longitude);
  const mapCoordinates = hasCoordinates
    ? `${apartment.latitude},${apartment.longitude}`
    : null;

  return (
    <Card className="order-1 min-w-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-none xl:order-none">
      <Card.Content className="p-0">
        <ApartmentGallery
          name={apartment.name}
          images={ordered}
          imagesError={imagesError}
        />

        <div className="space-y-4 p-4">
          <ApartmentIdentity
            apartment={apartment}
            verification={verification}
          />
          <Separator />
          <section aria-label="Property overview">
            <h2 className="flex items-center gap-2 font-nunito text-lg font-bold text-primary">
              <ClipboardList size={20} aria-hidden="true" /> Property overview
            </h2>
            <div className="mt-4 space-y-6">
              <div className="rounded-2xl bg-muted/30 p-4">
                <h3 className="flex items-center gap-2 font-nunito text-sm font-semibold text-foreground">
                  <ReceiptText size={20} className="text-primary" aria-hidden="true" />
                  Rent &amp; Lease
                </h3>
                <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2 xl:grid-cols-4">
                  <PropertyFact
                    icon={<PhilippinePeso size={20} />}
                    label="Monthly rent"
                    value={formatPesoDisplay(apartment.monthly_rent)}
                  />
                  <PropertyFact
                    icon={<Wallet size={20} />}
                    label="Security deposit"
                    value={
                      apartment.security_deposit == null
                        ? "—"
                        : formatPesoDisplay(apartment.security_deposit)
                    }
                  />
                  <PropertyFact
                    icon={<Coins size={20} />}
                    label="Advance rent"
                    value={
                      apartment.advance_rent == null
                        ? "—"
                        : formatPesoDisplay(apartment.advance_rent)
                    }
                  />
                  <PropertyFact
                    icon={<Calendar size={20} />}
                    label="Lease duration"
                    value={apartment.lease_duration ?? "—"}
                  />
                </div>
              </div>
              <div>
                <h3 className="flex items-center gap-2 font-nunito text-sm font-semibold text-foreground">
                  <LayoutGrid size={20} className="text-primary" aria-hidden="true" />
                  Property Details
                </h3>
                <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2 xl:grid-cols-4">
                  <PropertyFact
                    icon={<House size={20} />}
                    label="Property type"
                    value={apartment.type}
                  />
                  <PropertyFact
                    icon={<BedDouble size={20} />}
                    label="Bedrooms"
                    value={String(apartment.no_bedrooms)}
                  />
                  <PropertyFact
                    icon={<Bath size={20} />}
                    label="Bathrooms"
                    value={String(apartment.no_bathrooms)}
                  />
                  <PropertyFact
                    icon={<Expand size={20} />}
                    label="Floor area"
                    value={`${apartment.area_sqm} sqm`}
                  />
                  <PropertyFact
                    icon={<Armchair size={20} />}
                    label="Furnishing"
                    value={apartment.furnished_type ?? "—"}
                  />
                  <PropertyFact
                    icon={<Building2 size={20} />}
                    label="Floor level"
                    value={apartment.floor_level ?? "—"}
                  />
                  <PropertyFact
                    icon={<Users size={20} />}
                    label="Max occupants"
                    value={
                      apartment.max_occupants == null
                        ? "—"
                        : String(apartment.max_occupants)
                    }
                  />
                </div>
              </div>
            </div>
          </section>
          <Separator />
          <ApartmentDescription description={apartment.description} />
          {apartment.amenities?.length ? (
            <>
              <Separator />
              <section>
                <h2 className="flex items-center gap-2 font-nunito text-lg font-bold text-primary">
                  <Tags size={20} aria-hidden="true" /> Amenities
                </h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {apartment.amenities.map((amenity) => (
                    <Chip key={amenity} size="sm" variant="soft">
                      {amenity.replaceAll("_", " ")}
                    </Chip>
                  ))}
                </div>
              </section>
            </>
          ) : null}
          <Separator />
          <section>
            <h2 className="flex items-center gap-2 font-nunito text-lg font-bold text-primary">
              <MapPin size={20} aria-hidden="true" /> Google Maps
            </h2>
            {mapCoordinates ? (
              <div className="mt-3 overflow-hidden rounded-2xl border border-border">
                <iframe
                  title={`Map of ${apartment.name}`}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(mapCoordinates)}&z=15&output=embed`}
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="h-64 w-full border-0 sm:h-72"
                />
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                Map coordinates unavailable.
              </p>
            )}
          </section>
        </div>
      </Card.Content>
    </Card>
  );
}
