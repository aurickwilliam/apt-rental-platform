"use client";

import {
  Accordion,
  AccordionBody,
  AccordionIndicator,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
  Button,
  Card,
  Spinner,
} from "@heroui/react";
import { MapPin } from "lucide-react";

import { requiresProofOfIncome, type ApplicationDocumentSlot } from "@repo/constants";
import {
  APPLICATION_DOCUMENT_SLOTS,
  APPLICATION_SLOT_LABELS,
  type ApplicationIssue,
  type PassportApplicationSelection,
} from "@repo/passport";
import { formatPesoDisplay } from "@repo/utils";

import PassportStatusChip from "@/app/components/passport/PassportStatusChip";
import type { PassportDocumentRow } from "@/hooks/use-passport-documents";

import type { ApplicationForm, ApplyApartmentContext } from "../../types";
import ApplicationIssues from "../ApplicationIssues";
import PassportNotice from "../PassportNotice";

interface ReviewStepProps {
  apartment: ApplyApartmentContext;
  form: ApplicationForm;
  totalMoveIn: number;
  readiness: {
    issues: ApplicationIssue[];
    isReady: boolean;
    loading: boolean;
    selection: PassportApplicationSelection<PassportDocumentRow>;
  };
  isSubmitting: boolean;
  submitError: string | null;
  onBack: () => void;
  onSubmit: () => void;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-card-foreground">{value || "—"}</span>
    </div>
  );
}

function yesNo(value: string | null): string {
  if (!value) return "—";
  return value === "yes" ? "Yes" : "No";
}

function formatDate(value: string): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}

function emptySlotLabel(slot: ApplicationDocumentSlot, employmentType: string): string {
  if (slot === "nbiClearance") return "Not provided (optional)";
  if (slot === "proofOfIncome" && !requiresProofOfIncome(employmentType)) return "Not provided (not required)";
  return "Missing";
}

const SECTION_ITEM = "overflow-hidden rounded-xl border border-border bg-muted";
const SECTION_TRIGGER = "flex w-full items-center justify-between p-4 text-sm font-semibold text-card-foreground";

export default function ReviewStep({
  apartment,
  form,
  totalMoveIn,
  readiness,
  isSubmitting,
  submitError,
  onBack,
  onSubmit,
}: ReviewStepProps) {
  const { docs } = readiness.selection;

  return (
    <div className="flex flex-col gap-6">
      <Card className="border border-border bg-card p-5 text-card-foreground shadow-none md:p-6">
        <p className="mb-1 text-xs tracking-widest text-muted-foreground uppercase">You are applying for</p>
        <h2 className="text-xl font-bold text-card-foreground">{apartment.name}</h2>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin size={14} /> {apartment.address}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
          <DetailRow label="Unit Type" value={apartment.type ?? "—"} />
          <DetailRow label="Furnishing" value={apartment.furnishedType ?? "—"} />
          <DetailRow label="Floor Level" value={apartment.floorLevel ?? "—"} />
          <DetailRow label="Max Occupants" value={apartment.maxOccupants ? `${apartment.maxOccupants} Person(s)` : "—"} />
          <DetailRow label="Lease Duration" value={apartment.leaseDuration ?? "—"} />
          <DetailRow label="Monthly Rent" value={formatPesoDisplay(apartment.monthlyRent) || "—"} />
          <DetailRow label="Security Deposit" value={formatPesoDisplay(apartment.securityDeposit) || "—"} />
          <DetailRow label="Advance Rent" value={formatPesoDisplay(apartment.advanceRent) || "—"} />
          <DetailRow label="Total Move-In Cost" value={formatPesoDisplay(totalMoveIn) || "—"} />
          <DetailRow label="Rental Owner" value={apartment.landlordName ?? "—"} />
        </div>
      </Card>

      <Card className="border border-border bg-card p-5 text-card-foreground shadow-none md:p-6">
        <h3 className="text-base font-semibold text-card-foreground">Summary of Application</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Please review your details. Make sure everything is accurate before submitting.
        </p>
        <Accordion
          allowsMultipleExpanded
          defaultExpandedKeys={new Set(["tenant", "documents"]) as never}
          className="flex flex-col gap-3"
        >
          <AccordionItem id="tenant" className={SECTION_ITEM}>
            <AccordionTrigger className={SECTION_TRIGGER}>
              Tenant Information
              <AccordionIndicator />
            </AccordionTrigger>
            <AccordionPanel>
              <AccordionBody className="px-4 pb-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <DetailRow label="Full Name" value={form.fullName} />
                  <DetailRow label="Email" value={form.email} />
                  <DetailRow label="Date of Birth" value={formatDate(form.dateOfBirth)} />
                  <DetailRow label="Contact Number" value={form.contactNumber} />
                  <div className="md:col-span-2">
                    <DetailRow label="Current Address" value={form.currentAddress} />
                  </div>
                  <DetailRow label="Employment Type" value={form.employmentType || "—"} />
                  <DetailRow label="Occupation" value={form.occupation || "—"} />
                  <DetailRow label="Company Name" value={form.companyName || "—"} />
                  <DetailRow label="Monthly Income" value={form.monthlyIncomeText || "—"} />
                  <DetailRow label="Previous Landlord Name" value={form.prevLandlordName || "—"} />
                  <DetailRow label="Previous Landlord Contact" value={form.prevLandlordContact || "—"} />
                </div>
              </AccordionBody>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem id="prefs" className={SECTION_ITEM}>
            <AccordionTrigger className={SECTION_TRIGGER}>
              Rental Preferences
              <AccordionIndicator />
            </AccordionTrigger>
            <AccordionPanel>
              <AccordionBody className="px-4 pb-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <DetailRow label="Move-in Date" value={formatDate(form.moveInDate)} />
                  <DetailRow label="Number of Occupants" value={form.noOccupants ? `${form.noOccupants} Person(s)` : "—"} />
                  <DetailRow label="Has Pets?" value={yesNo(form.hasPets)} />
                  <DetailRow label="Smoker?" value={yesNo(form.isSmoker)} />
                  <DetailRow label="Need Parking?" value={yesNo(form.needParking)} />
                  <div className="md:col-span-2">
                    <DetailRow label="Additional Notes" value={form.additionalNotes || "—"} />
                  </div>
                </div>
              </AccordionBody>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem id="documents" className={SECTION_ITEM}>
            <AccordionTrigger className={SECTION_TRIGGER}>
              APT Passport Documents
              <AccordionIndicator />
            </AccordionTrigger>
            <AccordionPanel>
              <AccordionBody className="px-4 pb-4">
                {readiness.loading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Spinner size="sm" color="accent" /> Checking your APT Passport…
                  </div>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {APPLICATION_DOCUMENT_SLOTS.map((slot) => {
                      const doc = docs[slot];
                      const hasBack = slot === "govId" && !!doc?.verification_id && !!doc.storage_path_back;
                      return (
                        <li
                          key={slot}
                          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-card-foreground">{APPLICATION_SLOT_LABELS[slot]}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {doc
                                ? `${doc.doc_type}${hasBack ? " (front & back)" : ""}`
                                : emptySlotLabel(slot, form.employmentType)}
                            </p>
                          </div>
                          {doc?.is_verified ? <PassportStatusChip status="verified" /> : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </AccordionBody>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>

        <div className="mt-5 space-y-3">
          <PassportNotice />
          {!readiness.loading ? <ApplicationIssues issues={readiness.issues} /> : null}
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" isDisabled={isSubmitting} onPress={onBack}>
            Back
          </Button>
          <Button
            className="flex-1"
            isDisabled={isSubmitting || readiness.loading || !readiness.isReady}
            isPending={isSubmitting}
            onPress={onSubmit}
          >
            {isSubmitting ? <Spinner size="sm" color="current" /> : null}
            {isSubmitting ? "Submitting…" : "Submit Application"}
          </Button>
        </div>
        {submitError ? (
          <p role="alert" className="mt-3 text-center text-sm text-danger">
            {submitError}
          </p>
        ) : (
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            The landlord is notified as soon as you submit.
          </p>
        )}
      </Card>
    </div>
  );
}
