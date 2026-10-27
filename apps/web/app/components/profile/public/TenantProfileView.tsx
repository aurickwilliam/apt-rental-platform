"use client";

import Image from "next/image";

import { IconCalendarMonth, IconHomeSearch, IconKey, IconShieldCheckFilled, IconStar } from "@tabler/icons-react";

import BackBtn from "@/app/browse/[apartmentId]/components/BackBtn";
import { canOptimizePublicApartmentImage } from "@/lib/public-apartment-image";
import { formatDurationMonths, memberSinceYear } from "@/lib/public-profile";

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
            <PublicProfileContactCard contact={contact} />
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
              <li key={stay.id} className="flex items-center gap-3 rounded-3xl border border-border bg-card p-3">
                <Image
                  src={stay.thumbnailUrl}
                  alt=""
                  width={96}
                  height={96}
                  unoptimized={!canOptimizePublicApartmentImage(stay.thumbnailUrl)}
                  className="size-24 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate font-nunito text-base font-semibold">{stay.apartmentName}</p>
                  {stay.location ? <p className="truncate text-xs text-muted-foreground">{stay.location}</p> : null}
                  <p className="mt-2 text-sm text-muted-foreground">{stay.stayPeriod}</p>
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
