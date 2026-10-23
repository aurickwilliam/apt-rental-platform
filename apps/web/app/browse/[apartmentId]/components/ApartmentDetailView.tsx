import Amenities from "./Amenities";
import BackBtn from "./BackBtn";
import ImageHeader from "./ImageHeader";
import RatingSection from "./RatingsSection";
import MapLocation from "./MapLocation";

import { Separator } from "@heroui/react";

import {
  IconHome,
  IconBed,
  IconBath,
  IconArrowsMaximize,
  IconUsers,
  IconBuilding,
  IconCalendar,
  IconArmchair,
} from "@tabler/icons-react";

import ApartmentReviewsPreview from "./ApartmentReviewsPreview";
import RelatedApartments from "./RelatedApartments";
import PriceCard from "./PriceCard";
import ShareBtn from "./ShareBtn";
import FavoriteBtn from "./FavoriteBtn";
import LandlordChatPanel from "./LandlordChatPanel";

import { createClient } from "@repo/supabase/server";
import LeaseAgreementCard from "./LeaseAgreementCard";
import ExpandableDescription from "./ExpandableDescription";

export default async function ApartmentDetailView({
  apartmentId,
  basePath = "/browse",
}: {
  apartmentId: string;
  basePath?: string;
}) {
  const supabase = await createClient();

  // Batch 1: auth state and apartment details are independent of each other.
  const [userResult, apartmentResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('apartments')
      .select(`
        *,
        apartment_images(url, url_thumb, is_cover)
      `)
      .eq('id', apartmentId)
      .eq('is_hidden_by_admin', false)
      .is('deleted_at', null)
      .single(),
  ]);

  const user = userResult.data.user;
  const { data: apartment, error } = apartmentResult;

  if (error || !apartment) {
    // handle not found
    return <div>Apartment not found.</div>;
  }

  // Batch 2: profile, landlord, and related apartments only need the
  // results above, so they run together.
  const profilePromise = user
      ? Promise.resolve(supabase
          .from("users")
          .select("id, roles, account_status")
          .eq("user_id", user.id)
          .maybeSingle())
      : Promise.resolve({ data: null });
  const pendingPromise = profilePromise.then(async ({ data: profile }) =>
    profile?.roles?.includes("tenant")
      ? await supabase.from("rental_application").select("id")
          .eq("tenant_id", profile.id).eq("apartment_id", apartmentId)
          .eq("status", "pending").limit(1)
      : { data: null },
  );
  const [profileResult, landlordResult, relatedResult, pendingResult] = await Promise.all([
    profilePromise,
    apartment.landlord_id
      ? supabase
          .from('users')
          .select('first_name, last_name, mobile_number, avatar_url')
          .eq('id', apartment.landlord_id)
          .filter('roles', 'cs', '{landlord}')
          .single()
      : Promise.resolve({ data: null }),
    supabase
      .from('apartments')
      .select('id, name, city, monthly_rent, average_rating, apartment_images(url, url_thumb, is_cover)')
      .eq('city', apartment.city)
      .neq('id', apartmentId)
      .in("status", ["available", "unverified"])
      .eq('is_hidden_by_admin', false)
      .is('deleted_at', null)
      .limit(10)
      .order("is_cover", { referencedTable: "apartment_images", ascending: false, nullsFirst: false })
      .limit(1, { referencedTable: "apartment_images" }),
    pendingPromise,
  ]);

  const { data: currentUser } = profileResult;
  const { data: landlord } = landlordResult;
  const { data: related } = relatedResult;

  // Batch 3: the pending-application check needs the profile id above.
  // Apply Now opens the start-of-application modal for tenants; everyone
  // else goes to the apply route, which redirects them (sign-in / browse).
  const isTenant = !!currentUser?.roles?.includes("tenant");
  const { data: pendingApplications } = pendingResult;
  const applyViewer =
    currentUser && isTenant
      ? {
          userId: currentUser.id,
          accountStatus: currentUser.account_status,
          hasActiveApplication: (pendingApplications ?? []).length > 0,
        }
      : null;

  // Fetch Lease Agreement URL if it exists
  const leaseUrl = apartment?.lease_agreement_url ?? null;

  const images = apartment.apartment_images?.map((img) => img.url) ?? ['/default/default-thumbnail.jpeg'];
  const thumbImages = apartment.apartment_images?.map((img) => img.url_thumb ?? img.url) ?? ['/default/default-thumbnail.jpeg'];

  // Fetch Related Apartments same city
  const relatedMapped = (related ?? []).map((apt) => {
    const cover = apt.apartment_images?.find((img) => img.is_cover);
    return {
      id: apt.id,
      name: apt.name,
      city: apt.city,
      monthly_rent: apt.monthly_rent,
      average_rating: apt.average_rating ?? 0,
      image: cover?.url_thumb ?? cover?.url ?? '/default/default-thumbnail.jpeg',
    };
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 w-full min-w-0 overflow-x-clip">
      <div className="flex items-center justify-between gap-2">
        <BackBtn />
        <div className="flex items-center gap-2">
          <ShareBtn />
          <FavoriteBtn apartmentId={apartment.id} />
        </div>
      </div>

      <div className="my-4">
        <ImageHeader imageUrl={images} thumbnailUrl={thumbImages} name={apartment.name} />
      </div>

      <div className="w-full flex flex-col lg:flex-row gap-8 lg:gap-5 min-w-0">
        <div className="w-full lg:w-2/3 min-w-0">
          {/* Name and Address */}
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-medium text-primary break-words">
              {apartment.name}
            </h1>
            <h3 className="text-sm sm:text-base text-foreground/80 break-words">
              {apartment.street_address}, {apartment.barangay}, {apartment.city}, {apartment.province}, {apartment.zip_code}
            </h3>
          </div>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4 sm:gap-6 mt-6 min-w-0">
            <div className="flex gap-2 items-center min-w-0">
              <IconHome size={22} className="text-grey-700 shrink-0" />
              <h2 className="text-sm sm:text-base font-medium text-grey-700 min-w-0 break-words">
                {apartment.type}
              </h2>
            </div>
            <div className="flex gap-2 items-center min-w-0">
              <IconBed size={22} className="text-grey-700 shrink-0" />
              <h2 className="text-sm sm:text-base font-medium text-grey-700 min-w-0 break-words">
                {apartment.no_bedrooms} Bedroom{apartment.no_bedrooms !== 1 ? 's' : ''}
              </h2>
            </div>
            <div className="flex gap-2 items-center min-w-0">
              <IconBath size={22} className="text-grey-700 shrink-0" />
              <h2 className="text-sm sm:text-base font-medium text-grey-700 min-w-0 break-words">
                {apartment.no_bathrooms} Bathroom{apartment.no_bathrooms !== 1 ? 's' : ''}
              </h2>
            </div>
            <div className="flex gap-2 items-center min-w-0">
              <IconArrowsMaximize size={22} className="text-grey-700 shrink-0" />
              <h2 className="text-sm sm:text-base font-medium text-grey-700 min-w-0 break-words">
                {apartment.area_sqm} sqm
              </h2>
            </div>

            <div className="flex gap-2 items-center min-w-0">
              <IconBuilding size={22} className="text-grey-700 shrink-0" />
              <h2 className="text-sm sm:text-base font-medium text-grey-700 min-w-0 break-words">
                {apartment.floor_level}
              </h2>
            </div>
            <div className="flex gap-2 items-center min-w-0">
              <IconUsers size={22} className="text-grey-700 shrink-0" />
              <h2 className="text-sm sm:text-base font-medium text-grey-700 min-w-0 break-words">
                {apartment.max_occupants} Occupant{apartment.max_occupants !== 1 ? 's' : ''}
              </h2>
            </div>
            <div className="flex gap-2 items-center min-w-0">
              <IconCalendar size={22} className="text-grey-700 shrink-0" />
              <h2 className="text-sm sm:text-base font-medium text-grey-700 min-w-0 break-words">
                {apartment.lease_duration}
              </h2>
            </div>
            <div className="flex gap-2 items-center min-w-0">
              <IconArmchair size={22} className="text-grey-700 shrink-0" />
              <h2 className="text-sm sm:text-base font-medium text-grey-700 min-w-0 break-words">
                {apartment.furnished_type}
              </h2>
            </div>
          </div>

          <Separator className="my-6 sm:my-8" />

          <ExpandableDescription text={apartment.description || ""} />

          <Separator className="my-6 sm:my-8" />

          <Amenities apartmentPerks={apartment.amenities ?? []} />

          <Separator className="my-6 sm:my-8" />

          <div>
            <h3 className="text-lg font-medium mb-2">View on Map</h3>
            <MapLocation latitude={apartment.latitude} longitude={apartment.longitude} />
          </div>

          <Separator className="my-6 sm:my-8" />

          <RatingSection apartmentId={apartment.id} basePath={basePath} />

          <div className="mt-8">
            <ApartmentReviewsPreview apartmentId={apartment.id} basePath={basePath} />
          </div>
        </div>

        <div className="w-full lg:w-1/3 min-w-0 flex flex-col gap-4 sm:gap-5">
          <PriceCard
            price={apartment.monthly_rent}
            apartmentStatus={apartment.status}
            securityDeposit={apartment.security_deposit ?? undefined}
            advancePayment={apartment.advance_rent ?? undefined}
            apartmentId={apartment.id}
            basePath={basePath}
            applyViewer={applyViewer}
            applyApartment={{
              id: apartment.id,
              name: apartment.name,
              location: [apartment.barangay, apartment.city].filter(Boolean).join(", ") || null,
              coverUrl: apartment.apartment_images?.find((img) => img.is_cover)?.url ?? images[0],
              landlordId: apartment.landlord_id ?? null,
              monthlyRent: apartment.monthly_rent,
              securityDeposit: apartment.security_deposit ?? 0,
              advanceRent: apartment.advance_rent ?? 0,
              maxOccupants: apartment.max_occupants ?? null,
            }}
          />

          <LeaseAgreementCard
            leaseDetailsUrl={leaseUrl ?? ''}
          />

          <LandlordChatPanel
            currentUserId={currentUser?.id ?? null}
            landlordId={apartment.landlord_id ?? null}
            landlordName={`${landlord?.first_name ?? ""} ${landlord?.last_name ?? ""}`}
            landlordAvatarUrl={landlord?.avatar_url ?? ""}
            apartmentId={apartment.id}
            apartmentName={apartment.name ?? ""}
          />
        </div>
      </div>

      <div className="w-full mt-10">
        <RelatedApartments apartments={relatedMapped} basePath={basePath} />
      </div>

      {/* Clearance for the mobile fixed price bar */}
      <div className="h-24 lg:hidden" aria-hidden="true" />
    </div>
  );
}
