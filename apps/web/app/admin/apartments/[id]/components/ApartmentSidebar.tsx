import Link from "next/link";
import { Button, Separator, Tooltip } from "@heroui/react";
import {
  IconAdjustmentsHorizontal,
  IconArrowRight,
  IconClock,
  IconEye,
  IconEyeOff,
  IconHome,
  IconInfoCircle,
  IconShieldCheck,
  IconUser,
} from "@tabler/icons-react";
import OperationForm from "../../../OperationForm";
import SharedUserAvatar from "@/app/components/profile/UserAvatar";
import { setApartmentVisibility } from "../../../actions/operations";
import type { Apartment, Landlord, Verification } from "../types";
import {
  dateOnly,
  dateTime,
  fullName,
  Section,
  SectionError,
  StatusChip,
} from "./DetailPrimitives";

export function ApartmentVerificationCard({
  apartment,
  verification,
  error,
  leaseUrl,
}: {
  apartment: Apartment;
  verification: Verification | null;
  error: boolean;
  leaseUrl: string | null;
}) {
  return (
    <Section
      title="Verification"
      icon={<IconShieldCheck size={20} />}
      className="order-2 xl:order-0"
    >
      {error ? (
        <SectionError />
      ) : verification ? (
        <div className="space-y-2 text-sm">
          <StatusChip status={verification.status} />
          <p className="text-muted-foreground">
            Submitted {dateTime.format(new Date(verification.submitted_at))}
          </p>
          {verification.reviewed_at ? (
            <p>
              Reviewed {dateTime.format(new Date(verification.reviewed_at))}
              {verification.reviewer_name
                ? ` by ${verification.reviewer_name}`
                : ""}
            </p>
          ) : null}
          {verification.rejection_reason ? (
            <p className="rounded-lg bg-danger/10 p-2 text-danger">
              {verification.rejection_reason}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Evidence: current listing images
            {apartment.lease_agreement_url ? " and lease agreement" : ""}. No
            ownership documents are attached to submissions.
          </p>
          {leaseUrl ? (
            <a
              href={leaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
            >
              Open lease agreement
            </a>
          ) : null}
          <Link
            href={`/admin/verification/apartments/${verification.id}`}
            className="inline-block font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
          >
            {verification.status === "pending"
              ? "Review verification"
              : "View verification details"}
          </Link>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          No property verification has been submitted yet.
        </p>
      )}
    </Section>
  );
}

export function ApartmentListingControls({
  apartment,
}: {
  apartment: Apartment;
}) {
  const hidden = apartment.is_hidden_by_admin;
  return (
    <Section
      title="Listing controls"
      icon={<IconAdjustmentsHorizontal size={20} />}
      headerExtra={
        <span className="flex items-center gap-1">
          <StatusChip
            status={hidden ? "hidden" : "visible"}
            icon={
              hidden ? (
                <IconEyeOff size={14} aria-hidden="true" />
              ) : (
                <IconEye size={14} aria-hidden="true" />
              )
            }
          />
          <Tooltip delay={0}>
            <Tooltip.Trigger>
              <Button
                variant="ghost"
                isIconOnly
                size="sm"
                aria-label="About listing visibility and occupancy status"
              >
                <IconInfoCircle size={16} aria-hidden="true" />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content placement="bottom" className="max-w-64">
              Listing visibility controls tenant discovery only. It does not
              change the occupancy status (currently{" "}
              {apartment.status.replaceAll("_", " ")}), tenancy, or payment
              records.
            </Tooltip.Content>
          </Tooltip>
        </span>
      }
      className="order-3 xl:order-0"
    >
      <div className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          {hidden
            ? "This property is currently hidden from tenant discovery. Existing applications, payments, and occupancy are unaffected."
            : "Control whether this property appears in search results and can be discovered by tenants."}
        </p>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2">
              <span
                className={`size-2 shrink-0 rounded-full ${hidden ? "bg-danger" : "bg-success"}`}
                aria-hidden="true"
              />
              {hidden ? "Hidden from tenants" : "Visible to tenants"}
            </p>
            {hidden && apartment.hidden_at ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Hidden {dateTime.format(new Date(apartment.hidden_at))}
                {apartment.hidden_reason ? ` · ${apartment.hidden_reason}` : ""}
              </p>
            ) : null}
          </div>
          <OperationForm
            id={apartment.id}
            decision={hidden ? "restore" : "hide"}
            label={hidden ? "Show listing" : "Hide listing"}
            onSubmit={setApartmentVisibility}
          />
        </div>
      </div>
    </Section>
  );
}

export function ApartmentLandlordCard({
  landlord,
  count,
  verifiedCount,
  error,
}: {
  landlord: Landlord | null;
  count: number | null;
  verifiedCount: number | null;
  error: boolean;
}) {
  return (
    <Section
      title="Landlord"
      icon={<IconUser size={20} />}
      className="order-5 xl:order-0"
    >
      {error ? (
        <SectionError />
      ) : landlord ? (
        <div className="space-y-4 text-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {landlord.avatar_url ? (
                <SharedUserAvatar
                  src={landlord.avatar_url}
                  initials={(fullName(landlord) || "Landlord")
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join("")}
                  alt={fullName(landlord) || "Landlord"}
                  className="size-12 shrink-0 rounded-full bg-primary/10 text-primary"
                  fallbackClassName="rounded-full bg-primary/10 text-primary"
                />
              ) : (
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <IconUser size={22} aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0">
                <p className="font-nunito font-bold wrap-break-word">
                  {fullName(landlord) || "Landlord"}
                </p>
                <p
                  className="truncate text-xs text-muted-foreground"
                  title={landlord.email ?? undefined}
                >
                  {landlord.email ?? "Email unavailable"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Member since {dateOnly.format(new Date(landlord.created_at))}
                </p>
              </div>
            </div>
            <StatusChip
              status={landlord.account_status}
              icon={
                landlord.account_status === "verified" ? (
                  <IconShieldCheck size={14} aria-hidden="true" />
                ) : undefined
              }
            />
          </div>
          <Separator />
          <div className="min-w-0">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Account / Activity
            </h3>
            <ul className="mt-2 space-y-2">
              <li className="flex min-w-0 items-center gap-2">
                <IconHome
                  size={16}
                  className="shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span className="min-w-0 truncate">
                  {count == null
                    ? "Properties unavailable"
                    : `${count} ${count === 1 ? "Property" : "Properties"}`}
                </span>
              </li>
              <li className="flex min-w-0 items-center gap-2">
                <IconShieldCheck
                  size={16}
                  className="shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span className="min-w-0 truncate">
                  {verifiedCount == null
                    ? "Verified count unavailable"
                    : `${verifiedCount} Verified ${verifiedCount === 1 ? "Property" : "Properties"}`}
                </span>
              </li>
              <li className="flex min-w-0 items-center gap-2">
                <IconClock
                  size={16}
                  className="shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span className="min-w-0 truncate">
                  {landlord.updated_at
                    ? `Last updated ${dateOnly.format(new Date(landlord.updated_at))}`
                    : "Last updated unavailable"}
                </span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/admin/users/${landlord.id}`}
              className="inline-flex items-center justify-center rounded-full border border-border px-3 py-2 text-center text-sm font-semibold text-foreground hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
            >
              View Landlord Profile
            </Link>
            <Link
              href={
                landlord.email || fullName(landlord)
                  ? `/admin/apartments?q=${encodeURIComponent(landlord.email || fullName(landlord))}`
                  : "/admin/apartments"
              }
              className="inline-flex items-center justify-center gap-1 rounded-full bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-primary"
            >
              {count == null ? "View Properties" : `View ${count} Properties`}
              <IconArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Landlord profile unavailable.
        </p>
      )}
    </Section>
  );
}
