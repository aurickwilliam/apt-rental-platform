"use client";

import NextImage from "next/image";
import { Button, Separator, Spinner } from "@heroui/react";
import { Armchair, Bath, BedDouble, Building2, Calendar as CalendarIcon, Expand, House, MapPin, Star, Users } from "lucide-react";

import type { ApplicationIssue } from "@repo/passport";
import { formatPesoDisplay } from "@repo/utils";

import UserAvatar from "@/app/components/profile/UserAvatar";

import type { ApplyApartmentContext } from "../../types";
import ApplicationIssues from "../ApplicationIssues";
import PassportNotice from "../PassportNotice";

interface ApartmentSummaryStepProps {
  apartment: ApplyApartmentContext;
  totalMoveIn: number;
  readiness: { issues: ApplicationIssue[]; isReady: boolean; loading: boolean; error: string | null; refresh: () => void };
  onContinue: () => void;
  onCancel: () => void;
  onOpenGuidelines: () => void;
}

function Spec({ icon: Icon, children }: { icon: typeof House; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon size={18} className="text-muted-foreground" /> <span className="font-medium text-card-foreground">{children}</span>
    </div>
  );
}

export default function ApartmentSummaryStep({
  apartment,
  totalMoveIn,
  readiness,
  onContinue,
  onCancel,
  onOpenGuidelines,
}: ApartmentSummaryStepProps) {
  return (
    <div className="flex w-full flex-col gap-5 md:flex-row">
      <div className="flex w-full flex-col gap-5 md:w-2/3">
        <div className="isolate overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm ring-1 ring-border">
          <div className="relative isolate h-80 overflow-hidden md:h-[440px]">
            <NextImage
              src={apartment.cover}
              alt={apartment.name ?? "Apartment"}
              fill
              sizes="(max-width:768px) 100vw, 800px"
              priority
              quality={90}
              unoptimized
              className="object-cover"
            />
            <div className="absolute right-0 bottom-0 left-0 h-[58%] bg-gradient-to-t from-black via-black/80 to-transparent" />
            <div className="absolute right-0 bottom-0 left-0 p-6 md:p-8">
              <h1 className="text-2xl leading-tight font-bold text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.9)] md:text-[28px]">
                {apartment.name}
              </h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.85)]">
                <MapPin size={14} className="shrink-0 text-white" /> {apartment.address}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-5 p-5 md:p-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Spec icon={House}>{apartment.type ?? "—"}</Spec>
              <Spec icon={BedDouble}>{apartment.noBedrooms ?? "—"} Bedrooms</Spec>
              <Spec icon={Bath}>{apartment.noBathrooms ?? "—"} Bathrooms</Spec>
              <Spec icon={Expand}>{apartment.areaSqm ?? "—"} sqm</Spec>
              <Spec icon={Building2}>{apartment.floorLevel ?? "—"}</Spec>
              <Spec icon={Users}>{apartment.maxOccupants ?? "—"} Occupants</Spec>
              <Spec icon={CalendarIcon}>{apartment.leaseDuration ?? "—"}</Spec>
              <Spec icon={Armchair}>{apartment.furnishedType ?? "—"}</Spec>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/3">
        <div className="flex flex-col gap-5 md:sticky md:top-4">
          <div className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-5 text-card-foreground shadow-sm ring-1 ring-border md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm">
                <Star size={16} className="fill-amber-500 text-amber-500" />
                <span className="font-semibold text-card-foreground">{apartment.averageRating?.toFixed(1) ?? "—"}</span>
                <span className="text-muted-foreground">rating</span>
              </div>
              {apartment.landlordName && (
                <div className="ml-auto flex items-center gap-2 text-sm">
                  <UserAvatar
                    src={apartment.landlordAvatarUrl}
                    initials={(apartment.landlordName.trim()[0] ?? "U").toUpperCase()}
                    alt="Owner"
                    className="size-6"
                    fallbackClassName="text-[10px]"
                  />
                  <span className="font-medium text-card-foreground">{apartment.landlordName}</span>
                  <span className="text-xs text-muted-foreground">Rental Owner</span>
                </div>
              )}
            </div>
            <Separator />
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monthly Rent</span>
                <span className="font-semibold text-card-foreground">{formatPesoDisplay(apartment.monthlyRent)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Security Deposit</span>
                <span className="font-medium text-card-foreground">{formatPesoDisplay(apartment.securityDeposit)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Advance Rent</span>
                <span className="font-medium text-card-foreground">{formatPesoDisplay(apartment.advanceRent)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-card-foreground">Total Move-in Cost</span>
                <span className="font-bold text-primary">{formatPesoDisplay(totalMoveIn)}</span>
              </div>
              {apartment.maxOccupants !== null && (
                <p className="text-xs text-muted-foreground">
                  This unit allows a maximum of {apartment.maxOccupants} occupant(s).
                </p>
              )}
            </div>

            <PassportNotice />

            {readiness.loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner size="sm" color="accent" /> Checking your APT Passport…
              </div>
            ) : readiness.error ? (
              <div className="space-y-2 rounded-2xl border border-danger/20 bg-danger/10 p-3" role="alert">
                <p className="text-sm text-card-foreground">Couldn&apos;t check your APT Passport: {readiness.error}</p>
                <Button size="sm" variant="danger-soft" onPress={readiness.refresh}>
                  Try again
                </Button>
              </div>
            ) : (
              <ApplicationIssues issues={readiness.issues} />
            )}

            <div className="flex flex-col gap-3">
              <Button
                className="w-full"
                isDisabled={readiness.loading || !!readiness.error || !readiness.isReady}
                onPress={onContinue}
              >
                Continue Application
              </Button>
              <Button variant="outline" className="w-full" onPress={onCancel}>
                Cancel
              </Button>
              <button
                type="button"
                onClick={onOpenGuidelines}
                className="self-center text-sm font-medium text-primary hover:underline"
              >
                View application guidelines
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
