"use client";

import Image from "next/image";
import Link from "next/link";

import { IconCalendarMonth, IconHomeSearch, IconKey, IconShieldCheckFilled, IconStar } from "@tabler/icons-react";

import BackBtn from "@/app/browse/[apartmentId]/components/BackBtn";
import { canOptimizePublicApartmentImage } from "@/lib/public-apartment-image";
import { apartmentHref, formatDurationMonths, landlordProfileHref, memberSinceYear } from "@/lib/public-profile";

import PublicProfileContactCard from "./PublicProfileContactCard";
import PublicProfileEmptyState from "./PublicProfileEmptyState";
import PublicProfileHeader from "./PublicProfileHeader";
import PublicProfileLayout from "./PublicProfileLayout";
import PublicProfileSection from "./PublicProfileSection";
import PublicProfileStats from "./PublicProfileStats";
import PublicProfileTagsCard from "./PublicProfileTagsCard";
import type { TenantProfileData } from "./types";

export default function TenantProfileView({ data }: { data: TenantProfileData }) {
  const { identity, contact, pastStays, stayHistory } = data;
  const firstName = identity.displayName.split(" ")[0] || "Tenant";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <BackBtn />
      </div>

      <PublicProfileLayout
        header={<PublicProfileHeader identity={identity} role="tenant" />}
        aside={
          <>
            <PublicProfileTagsCard
              title="Verified on APT Passport"
              tone="success"
              items={data.verifiedDocuments.map((doc) => ({
                key: doc.slot,
                label: doc.label,
                icon: <IconShieldCheckFilled size={14} aria-hidden="true" />,
              }))}
              emptyText="No verified documents to show. Documents are visible to you only while this tenant has an open application with you."
            />
            <PublicProfileStats
              stats={[
                {
                  label: "Reviews written",
                  value: data.reviewCount,
                  icon: <IconStar size={20} className="text-rating" aria-hidden="true" />,
                },
                {
                  label: "Member since",
                  value: memberSinceYear(identity.joinedAt) ?? "—",
                  icon: <IconCalendarMonth size={20} aria-hidden="true" />,
                },
                {
                  label: "Completed stays",
                  value: stayHistory.completedStays,
                  icon: <IconKey size={20} aria-hidden="true" />,
                  hint:
                    stayHistory.longestStayMonths === null
                      ? undefined
                      : `Longest: ${formatDurationMonths(stayHistory.longestStayMonths)}`,
                },
              ]}
            />
            <PublicProfileContactCard contact={contact} displayName={firstName} />
          </>
        }
      >
      <PublicProfileSection title={`${firstName}'s past stays`}>
        {pastStays.length === 0 ? (
          <PublicProfileEmptyState
            icon={IconHomeSearch}
            title="No rental history yet"
            description="This tenant has no completed leases on the platform yet."
          />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {pastStays.map((stay) => (
              <li
                key={stay.id}
                className={`relative flex items-center gap-3 rounded-3xl border border-border bg-card p-3 transition-colors ${
                  stay.apartmentId ? "cursor-pointer hover:border-primary" : ""
                }`}
              >
                <Image
                  src={stay.thumbnailUrl}
                  alt=""
                  width={96}
                  height={96}
                  unoptimized={!canOptimizePublicApartmentImage(stay.thumbnailUrl)}
                  className="size-24 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0">
                  {stay.apartmentId ? (
                    <Link
                      href={apartmentHref("public", stay.apartmentId)}
                      className="block cursor-pointer truncate font-nunito text-base font-semibold after:absolute after:inset-0 after:rounded-3xl after:content-[''] hover:text-primary focus-visible:outline-none after:focus-visible:outline-2 after:focus-visible:outline-offset-2 after:focus-visible:outline-primary"
                    >
                      {stay.apartmentName}
                    </Link>
                  ) : (
                    <p className="truncate font-nunito text-base font-semibold">{stay.apartmentName}</p>
                  )}
                  {stay.location ? <p className="truncate text-xs text-muted-foreground">{stay.location}</p> : null}
                  <p className="mt-2 text-sm text-muted-foreground">
                    {stay.stayPeriod}
                    {stay.durationLabel ? ` · ${stay.durationLabel}` : ""}
                  </p>
                  {stay.landlord ? (
                    <p className="truncate text-xs text-muted-foreground">
                      Landlord:{" "}
                      <Link
                        href={landlordProfileHref("public", stay.landlord.id)}
                        className="relative z-10 cursor-pointer font-semibold text-foreground hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        {stay.landlord.name}
                      </Link>
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </PublicProfileSection>
      </PublicProfileLayout>
    </div>
  );
}
