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
import { IconMapPin } from "@tabler/icons-react";

import { requiresProofOfIncome, type ApplicationDocumentSlot } from "@repo/constants";
import {
  APPLICATION_DOCUMENT_SLOTS,
  type ApplicationIssue,
  type PassportApplicationSelection,
} from "@repo/passport";
import { formatPesoDisplay } from "@repo/utils";
import {
  APARTMENT_TYPE_KEYS,
  APPLICATION_SLOT_KEYS,
  EMPLOYMENT_TYPE_KEYS,
  FLOOR_LEVEL_KEYS,
  FURNISHED_TYPE_KEYS,
  LEASE_DURATION_KEYS,
  enumLabel,
  formatDate,
  type EnumKeyMap,
} from "@repo/i18n";

import PassportStatusChip from "@/app/components/passport/PassportStatusChip";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";
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
    isPassportIncomplete: boolean;
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

const SECTION_ITEM = "overflow-hidden rounded-xl border border-border bg-muted";
const SECTION_TRIGGER = "flex w-full cursor-pointer items-center justify-between p-4 text-sm font-semibold text-card-foreground";

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
  const { language, t } = useTranslation();
  const { docs } = readiness.selection;

  const yesNo = (value: string | null) => {
    if (!value) return "—";
    return value === "yes" ? t("common.yes") : t("common.no");
  };

  const formatValueDate = (value: string) =>
    value ? formatDate(value, "short", language) : "—";

  const enumOrRaw = (map: EnumKeyMap, value: string | null) =>
    value && map[value] ? enumLabel(language, map, value) : (value ?? "—");

  const emptySlotLabel = (slot: ApplicationDocumentSlot, employmentType: string) => {
    if (slot === "nbiClearance") return t("apply.review.notProvidedOptional");
    if (slot === "proofOfIncome" && !requiresProofOfIncome(employmentType)) {
      return t("apply.review.notProvidedNotRequired");
    }
    return t("apply.review.missing");
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="border border-border bg-card p-5 text-card-foreground shadow-none md:p-6">
        <p className="mb-1 text-xs tracking-widest text-muted-foreground uppercase">
          {t("apply.review.applyingFor")}
        </p>
        <h2 className="text-xl font-bold text-card-foreground">{apartment.name}</h2>
        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <IconMapPin size={14} /> {apartment.address}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
          <DetailRow
            label={t("apply.detail.unitType")}
            value={enumOrRaw(APARTMENT_TYPE_KEYS, apartment.type)}
          />
          <DetailRow
            label={t("apply.detail.furnishing")}
            value={enumOrRaw(FURNISHED_TYPE_KEYS, apartment.furnishedType)}
          />
          <DetailRow
            label={t("apply.detail.floorLevel")}
            value={enumOrRaw(FLOOR_LEVEL_KEYS, apartment.floorLevel)}
          />
          <DetailRow
            label={t("apply.detail.maxOccupants")}
            value={apartment.maxOccupants ? t("apply.review.persons", { count: apartment.maxOccupants }) : "—"}
          />
          <DetailRow
            label={t("apply.detail.leaseDuration")}
            value={enumOrRaw(LEASE_DURATION_KEYS, apartment.leaseDuration)}
          />
          <DetailRow label={t("apply.detail.monthlyRent")} value={formatPesoDisplay(apartment.monthlyRent) || "—"} />
          <DetailRow
            label={t("apply.detail.securityDeposit")}
            value={formatPesoDisplay(apartment.securityDeposit) || "—"}
          />
          <DetailRow label={t("apply.detail.advanceRent")} value={formatPesoDisplay(apartment.advanceRent) || "—"} />
          <DetailRow label={t("apply.detail.totalMoveIn")} value={formatPesoDisplay(totalMoveIn) || "—"} />
          <DetailRow label={t("apply.detail.rentalOwner")} value={apartment.landlordName ?? "—"} />
        </div>
      </Card>

      <Card className="border border-border bg-card p-5 text-card-foreground shadow-none md:p-6">
        <h3 className="text-base font-semibold text-card-foreground">{t("apply.review.summaryTitle")}</h3>
        <p className="mb-4 text-xs text-muted-foreground">{t("apply.review.summaryBody")}</p>
        <Accordion
          allowsMultipleExpanded
          defaultExpandedKeys={new Set(["tenant", "prefs", "documents"]) as never}
          className="flex flex-col gap-3"
        >
          <AccordionItem id="tenant" className={SECTION_ITEM}>
            <AccordionTrigger className={SECTION_TRIGGER}>
              {t("apply.review.tenantSection")}
              <AccordionIndicator className="text-muted-foreground!" />
            </AccordionTrigger>
            <AccordionPanel>
              <AccordionBody className="px-4 pb-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <DetailRow label={t("apply.field.fullName")} value={form.fullName} />
                  <DetailRow label={t("apply.field.email")} value={form.email} />
                  <DetailRow label={t("apply.field.dateOfBirth")} value={formatValueDate(form.dateOfBirth)} />
                  <DetailRow label={t("apply.field.contactNumber")} value={form.contactNumber} />
                  <div className="md:col-span-2">
                    <DetailRow label={t("apply.field.currentAddress")} value={form.currentAddress} />
                  </div>
                  <DetailRow
                    label={t("apply.detail.employmentType")}
                    value={enumOrRaw(EMPLOYMENT_TYPE_KEYS, form.employmentType || null)}
                  />
                  <DetailRow label={t("apply.detail.occupation")} value={form.occupation || "—"} />
                  <DetailRow label={t("apply.detail.companyName")} value={form.companyName || "—"} />
                  <DetailRow label={t("apply.detail.monthlyIncome")} value={form.monthlyIncomeText || "—"} />
                  <DetailRow label={t("apply.detail.prevLandlordName")} value={form.prevLandlordName || "—"} />
                  <DetailRow label={t("apply.detail.prevLandlordContact")} value={form.prevLandlordContact || "—"} />
                </div>
              </AccordionBody>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem id="prefs" className={SECTION_ITEM}>
            <AccordionTrigger className={SECTION_TRIGGER}>
              {t("apply.review.prefsSection")}
              <AccordionIndicator className="text-muted-foreground!" />
            </AccordionTrigger>
            <AccordionPanel>
              <AccordionBody className="px-4 pb-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <DetailRow label={t("apply.detail.moveInDate")} value={formatValueDate(form.moveInDate)} />
                  <DetailRow
                    label={t("apply.detail.occupants")}
                    value={form.noOccupants ? t("apply.review.persons", { count: form.noOccupants }) : "—"}
                  />
                  <DetailRow label={t("apply.detail.hasPets")} value={yesNo(form.hasPets)} />
                  <DetailRow label={t("apply.detail.smoker")} value={yesNo(form.isSmoker)} />
                  <DetailRow label={t("apply.detail.parking")} value={yesNo(form.needParking)} />
                  <div className="md:col-span-2">
                    <DetailRow label={t("apply.detail.notes")} value={form.additionalNotes || "—"} />
                  </div>
                </div>
              </AccordionBody>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem id="documents" className={SECTION_ITEM}>
            <AccordionTrigger className={SECTION_TRIGGER}>
              {t("apply.review.documentsSection")}
              <AccordionIndicator className="text-muted-foreground!" />
            </AccordionTrigger>
            <AccordionPanel>
              <AccordionBody className="px-4 pb-4">
                {readiness.loading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Spinner size="sm" color="accent" /> {t("apply.review.checkingPassport")}
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
                            <p className="text-sm font-medium text-card-foreground">
                              {APPLICATION_SLOT_KEYS[slot]
                                ? enumLabel(language, APPLICATION_SLOT_KEYS, slot)
                                : slot}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {doc
                                ? `${doc.doc_type}${hasBack ? t("apply.review.frontAndBack") : ""}`
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
          {!readiness.loading && !readiness.isPassportIncomplete ? <PassportNotice /> : null}
          {!readiness.loading ? <ApplicationIssues issues={readiness.issues} /> : null}
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" isDisabled={isSubmitting} onPress={onBack}>
            {t("apply.back")}
          </Button>
          <Button
            className="flex-1"
            isDisabled={isSubmitting || readiness.loading || !readiness.isReady}
            isPending={isSubmitting}
            onPress={onSubmit}
          >
            {isSubmitting ? <Spinner size="sm" color="current" /> : null}
            {isSubmitting ? t("apply.review.submitting") : t("apply.review.submit")}
          </Button>
        </div>
        {submitError ? (
          <p role="alert" className="mt-3 text-center text-sm text-danger">
            {submitError}
          </p>
        ) : (
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            {t("apply.review.landlordNotified")}
          </p>
        )}
      </Card>
    </div>
  );
}
