import Link from "next/link";
import ApartmentThumbnail from "../../components/ApartmentThumbnail";
import OperationForm from "../../../OperationForm";
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
    <Section title="Verification" className="order-2 xl:order-none">
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
  return (
    <Section title="Listing controls" className="order-3 xl:order-none">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span>Discovery visibility</span>
        <StatusChip
          status={apartment.is_hidden_by_admin ? "hidden" : "visible"}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Availability ({apartment.status.replaceAll("_", " ")}) is independent of
        discovery visibility.
      </p>
      {apartment.is_hidden_by_admin && apartment.hidden_at ? (
        <p className="mt-2 text-xs text-muted-foreground">
          Hidden {dateTime.format(new Date(apartment.hidden_at))}
          {apartment.hidden_reason ? ` · ${apartment.hidden_reason}` : ""}
        </p>
      ) : null}
      <div className="mt-3">
        <OperationForm
          id={apartment.id}
          decision={apartment.is_hidden_by_admin ? "restore" : "hide"}
          onSubmit={setApartmentVisibility}
        />
      </div>
    </Section>
  );
}

export function ApartmentLandlordCard({
  landlord,
  count,
  error,
}: {
  landlord: Landlord | null;
  count: number | null;
  error: boolean;
}) {
  return (
    <Section title="Landlord" className="order-5 xl:order-none">
      {error ? (
        <SectionError />
      ) : landlord ? (
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-3">
            <ApartmentThumbnail url={landlord.avatar_url} />
            <div className="min-w-0">
              <p className="font-nunito font-bold">
                {fullName(landlord) || "Landlord"}
              </p>
              <StatusChip status={landlord.account_status} />
            </div>
          </div>
          <p className="wrap-break-word text-muted-foreground">
            {landlord.email ?? "Email unavailable"}
          </p>
          {landlord.mobile_number ? (
            <p className="text-muted-foreground">{landlord.mobile_number}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {count == null
              ? "Property count unavailable"
              : `${count} properties`}{" "}
            · Member since {dateOnly.format(new Date(landlord.created_at))}
          </p>
          <Link
            href={`/admin/users/${landlord.id}`}
            className="inline-block font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
          >
            View landlord and other properties
          </Link>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Landlord profile unavailable.
        </p>
      )}
    </Section>
  );
}
