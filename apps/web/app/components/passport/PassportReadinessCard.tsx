"use client";

import Link from "next/link";
import { Button, Card } from "@heroui/react";
import StatusChip from "@/app/components/display/StatusChip";
import { IconAlertTriangle, IconCheck, IconCircleDashed, IconMinus, IconPlus } from "@tabler/icons-react";

import type { ApplicationDocumentSlot } from "@repo/constants";
import { getPassportSlotStates, APPLICATION_DOCUMENT_SLOTS } from "@repo/passport";
import {
  APPLICATION_SLOT_KEYS,
  PASSPORT_DOC_TYPE_KEYS,
  enumLabel,
  type TranslationKey,
} from "@repo/i18n";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import type { PassportDocumentRow } from "@/hooks/use-passport-documents";

import { PASSPORT_SLOT_UPLOAD_TYPE } from "./passportSlots";

const SLOT_HINT_KEYS: Record<ApplicationDocumentSlot, TranslationKey> = {
  govId: "passport.readiness.hint.required",
  proofOfBilling: "passport.readiness.hint.required",
  proofOfIncome: "passport.readiness.hint.income",
  nbiClearance: "passport.readiness.hint.optional",
};

interface PassportReadinessCardProps {
  documents: readonly PassportDocumentRow[];
  onAddDocument: (docType: string) => void;
}

/**
 * Which application slots the Passport can fill today. Uses the same slot
 * rules as the apply flow, so "ready" here means a submit won't be blocked by
 * missing documents.
 */
export default function PassportReadinessCard({ documents, onAddDocument }: PassportReadinessCardProps) {
  const { language, t } = useTranslation();
  const states = getPassportSlotStates(documents);
  const isReady = states.govId.state === "ready" && states.proofOfBilling.state === "ready";

  return (
    <Card className="rounded-2xl border border-border bg-card p-4 shadow-none">
      <Card.Content className="flex flex-col gap-3 p-0">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-nunito text-lg font-semibold text-card-foreground">
            {t("passport.readiness.title")}
          </h2>
          <StatusChip size="sm" tone={isReady ? "success" : "warning"} className="shrink-0 text-[11px]">
            {isReady ? t("passport.readiness.ready") : t("passport.readiness.notReady")}
          </StatusChip>
        </div>

        <ul className="divide-y divide-border">
          {APPLICATION_DOCUMENT_SLOTS.map((slot) => {
            const { doc, state } = states[slot];
            const isOptional = slot === "nbiClearance" || slot === "proofOfIncome";
            const uploadType = slot === "govId" ? null : PASSPORT_SLOT_UPLOAD_TYPE[slot];
            const slotLabel = enumLabel(language, APPLICATION_SLOT_KEYS, slot);

            return (
              <li key={slot} className="flex items-center gap-3 py-2.5">
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full border ${
                    state === "ready"
                      ? "border-success/40 bg-success/10 text-success"
                      : state === "expired"
                        ? "border-danger/40 bg-danger/10 text-danger"
                        : "border-border bg-muted text-muted-foreground"
                  }`}
                  aria-hidden="true"
                >
                  {state === "ready" ? (
                    <IconCheck size={16} />
                  ) : state === "expired" ? (
                    <IconAlertTriangle size={16} />
                  ) : isOptional ? (
                    <IconMinus size={16} />
                  ) : (
                    <IconCircleDashed size={16} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-card-foreground">{slotLabel}</p>
                  <p className={`truncate text-xs ${state === "expired" ? "text-danger" : "text-muted-foreground"}`}>
                    {state === "ready" && doc
                      ? enumLabel(language, PASSPORT_DOC_TYPE_KEYS, doc.doc_type)
                      : state === "expired"
                        ? t("passport.readiness.expired")
                        : t(SLOT_HINT_KEYS[slot])}
                  </p>
                </div>
                {state !== "ready" ? (
                  uploadType ? (
                    <Button
                      size="sm"
                      variant="primary"
                      aria-label={t("passport.readiness.addAria", { slot: slotLabel })}
                      onPress={() => onAddDocument(uploadType)}
                    >
                      <IconPlus size={16} aria-hidden="true" />
                      {t("passport.readiness.add")}
                    </Button>
                  ) : (
                    <Link href="/verify" className="text-sm font-medium text-primary hover:underline">
                      {t("passport.readiness.verify")}
                    </Link>
                  )
                ) : null}
              </li>
            );
          })}
        </ul>
      </Card.Content>
    </Card>
  );
}
