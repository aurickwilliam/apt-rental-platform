import type { ReactNode } from "react";
import { Card, Chip, Separator } from "@heroui/react";
import {
  IconAirConditioning,
  IconAlertTriangle,
  IconArmchair,
  IconArrowsMaximize,
  IconArrowsUpDown,
  IconBabyCarriage,
  IconBarbell,
  IconBath,
  IconBed,
  IconBellRinging,
  IconBolt,
  IconBrush,
  IconBuilding,
  IconCalendar,
  IconCamera,
  IconCar,
  IconClipboardList,
  IconCoffee,
  IconCoins,
  IconCurrencyPeso,
  IconDeviceTv,
  IconDroplets,
  IconFence,
  IconFireExtinguisher,
  IconFlame,
  IconFridge,
  IconHome,
  IconLamp,
  IconLayoutGrid,
  IconLock,
  IconMapPin,
  IconMicrowave,
  IconMotorbike,
  IconPackage,
  IconParking,
  IconPaw,
  IconPlug,
  IconPool,
  IconReceipt,
  IconShieldCheck,
  IconShirt,
  IconSmoking,
  IconSmokingNo,
  IconSun,
  IconTags,
  IconTemperature,
  IconToolsKitchen2,
  IconTree,
  IconTruck,
  IconUsers,
  IconWallet,
  IconWashMachine,
  IconWifi,
  IconWind,
  type Icon,
} from "@tabler/icons-react";
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
  reviewMode?: boolean;
}

const AMENITY_LABELS: Record<string, string> = {
  ac: "AC",
  cabletv: "Cable TV",
  cctv: "CCTV",
  hotwater: "Hot Water",
  moving_in: "Moving In",
  smartlock: "Smart Lock",
  tv: "TV",
  wifi: "Wi-Fi",
};

// Admin detail icons stay on Tabler; the shared PERKS catalog uses Lucide for other portals.
const AMENITY_ICONS: Record<string, Icon> = {
  bath: IconBath,
  hotwater: IconTemperature,
  toilet: IconBath,
  cleaning: IconBrush,
  washer: IconWashMachine,
  dryer: IconWind,
  wifi: IconWifi,
  tv: IconDeviceTv,
  cabletv: IconDeviceTv,
  ac: IconAirConditioning,
  electricfan: IconWind,
  ceiling_fan: IconWind,
  fridge: IconFridge,
  microwave: IconMicrowave,
  kettle: IconCoffee,
  kitchen: IconToolsKitchen2,
  stove: IconFlame,
  cooking_utensils: IconToolsKitchen2,
  no_cooking: IconToolsKitchen2,
  water_dispenser: IconDroplets,
  furniture: IconArmchair,
  wardrobe: IconShirt,
  bed: IconBed,
  lamp: IconLamp,
  balcony: IconSun,
  garden: IconTree,
  fenced: IconFence,
  elevator: IconArrowsUpDown,
  rooftop: IconBuilding,
  parking: IconCar,
  parkroad: IconCar,
  motorbikeparking: IconMotorbike,
  covered_parking: IconParking,
  security: IconShieldCheck,
  cctv: IconCamera,
  smartlock: IconLock,
  intercom: IconBellRinging,
  smokealarm: IconAlertTriangle,
  fireextinguisher: IconFireExtinguisher,
  electricity: IconBolt,
  water: IconDroplets,
  generator: IconPlug,
  gym: IconBarbell,
  pool: IconPool,
  petfriendly: IconPaw,
  childfriendly: IconBabyCarriage,
  nonsmoking: IconSmokingNo,
  smoking: IconSmoking,
  storage: IconPackage,
  moving_in: IconTruck,
};

function amenityLabel(key: string): string {
  return (
    AMENITY_LABELS[key] ??
    key.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
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
  reviewMode = false,
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
    <Card className="order-1 min-w-0 overflow-hidden rounded-3xl border border-border bg-card p-0 shadow-none xl:order-0">
      <Card.Content className="p-0">
        <ApartmentGallery
          name={apartment.name}
          images={ordered}
          imagesError={imagesError}
          backHref={reviewMode ? "/admin/verification?tab=apartments" : undefined}
          backLabel={reviewMode ? "Back to verification" : undefined}
        />

        <div className="space-y-4 p-4">
          <ApartmentIdentity
            apartment={apartment}
            verification={verification}
            showReviewAction={!reviewMode}
            headingLevel={reviewMode ? "h2" : "h1"}
          />
          <Separator />
          <section aria-label="Property overview">
            <h2 className="flex items-center gap-2 font-nunito text-lg font-bold text-primary">
              <IconClipboardList size={20} aria-hidden="true" /> Property overview
            </h2>
            <div className="mt-4 space-y-6">
              <div className="rounded-3xl bg-muted/30 p-4">
                <h3 className="flex items-center gap-2 font-nunito text-sm font-semibold text-foreground">
                  <IconReceipt
                    size={20}
                    className="text-primary"
                    aria-hidden="true"
                  />
                  Rent &amp; Lease
                </h3>
                <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2 xl:grid-cols-4">
                  <PropertyFact
                    icon={<IconCurrencyPeso size={20} />}
                    label="Monthly rent"
                    value={formatPesoDisplay(apartment.monthly_rent)}
                  />
                  <PropertyFact
                    icon={<IconWallet size={20} />}
                    label="Security deposit"
                    value={
                      apartment.security_deposit == null
                        ? "—"
                        : formatPesoDisplay(apartment.security_deposit)
                    }
                  />
                  <PropertyFact
                    icon={<IconCoins size={20} />}
                    label="Advance rent"
                    value={
                      apartment.advance_rent == null
                        ? "—"
                        : formatPesoDisplay(apartment.advance_rent)
                    }
                  />
                  <PropertyFact
                    icon={<IconCalendar size={20} />}
                    label="Lease duration"
                    value={apartment.lease_duration ?? "—"}
                  />
                </div>
              </div>
              <div>
                <h3 className="flex items-center gap-2 font-nunito text-sm font-semibold text-foreground">
                  <IconLayoutGrid
                    size={20}
                    className="text-primary"
                    aria-hidden="true"
                  />
                  Property Details
                </h3>
                <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2 xl:grid-cols-4">
                  <PropertyFact
                    icon={<IconHome size={20} />}
                    label="Property type"
                    value={apartment.type}
                  />
                  <PropertyFact
                    icon={<IconBed size={20} />}
                    label="Bedrooms"
                    value={String(apartment.no_bedrooms)}
                  />
                  <PropertyFact
                    icon={<IconBath size={20} />}
                    label="Bathrooms"
                    value={String(apartment.no_bathrooms)}
                  />
                  <PropertyFact
                    icon={<IconArrowsMaximize size={20} />}
                    label="Floor area"
                    value={`${apartment.area_sqm} sqm`}
                  />
                  <PropertyFact
                    icon={<IconArmchair size={20} />}
                    label="Furnishing"
                    value={apartment.furnished_type ?? "—"}
                  />
                  <PropertyFact
                    icon={<IconBuilding size={20} />}
                    label="Floor level"
                    value={apartment.floor_level ?? "—"}
                  />
                  <PropertyFact
                    icon={<IconUsers size={20} />}
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
                  <IconTags size={20} aria-hidden="true" /> Amenities
                </h2>
                <div className="mt-5 flex flex-wrap gap-2">
                  {apartment.amenities.map((amenity) => {
                    const key = amenity
                      .toLowerCase()
                      .trim()
                      .replaceAll(" ", "_");
                    const AmenityIcon = AMENITY_ICONS[key] ?? IconHome;
                    return (
                      <Chip key={amenity} size="md" variant="soft">
                        <AmenityIcon
                          size={16}
                          className="text-primary mr-1"
                          aria-hidden="true"
                        />
                        {amenityLabel(key)}
                      </Chip>
                    );
                  })}
                </div>
              </section>
            </>
          ) : null}
          <Separator />
          <section>
            <h2 className="flex items-center gap-2 font-nunito text-lg font-bold text-primary">
              <IconMapPin size={20} aria-hidden="true" /> Google Maps
            </h2>
            {mapCoordinates ? (
              <div className="mt-3 overflow-hidden rounded-3xl border border-border">
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
