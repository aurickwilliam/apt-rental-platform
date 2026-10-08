import Link from "next/link";
import { Button, Card, Chip } from "@heroui/react";
import { IconAlertTriangle, IconCheck, IconCircleDashed, IconMinus, IconPlus } from "@tabler/icons-react";

import type { ApplicationDocumentSlot } from "@repo/constants";
import { APPLICATION_DOCUMENT_SLOTS, APPLICATION_SLOT_LABELS, getPassportSlotStates } from "@repo/passport";

import type { PassportDocumentRow } from "@/hooks/use-passport-documents";

import { PASSPORT_SLOT_UPLOAD_TYPE } from "./passportSlots";

const SLOT_HINT: Record<ApplicationDocumentSlot, string> = {
  govId: "Required",
  proofOfBilling: "Required",
  proofOfIncome: "Required unless you're a student or unemployed",
  nbiClearance: "Optional",
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
  const states = getPassportSlotStates(documents);
  const isReady = states.govId.state === "ready" && states.proofOfBilling.state === "ready";

  return (
    <Card className="rounded-2xl border border-border bg-card p-4 shadow-none">
      <Card.Content className="flex flex-col gap-3 p-0">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-nunito text-lg font-semibold text-card-foreground">Application documents</h2>
          <Chip size="sm" variant="soft" color={isReady ? "success" : "warning"} className="shrink-0 text-[11px]">
            {isReady ? "Ready to apply" : "Not ready yet"}
          </Chip>
        </div>

        <ul className="divide-y divide-border">
          {APPLICATION_DOCUMENT_SLOTS.map((slot) => {
            const { doc, state } = states[slot];
            const isOptional = slot === "nbiClearance" || slot === "proofOfIncome";
            const uploadType = slot === "govId" ? null : PASSPORT_SLOT_UPLOAD_TYPE[slot];

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
                  <p className="text-sm font-semibold text-card-foreground">{APPLICATION_SLOT_LABELS[slot]}</p>
                  <p className={`truncate text-xs ${state === "expired" ? "text-danger" : "text-muted-foreground"}`}>
                    {state === "ready" && doc
                      ? doc.doc_type
                      : state === "expired"
                        ? "Expired. Upload a current copy."
                        : SLOT_HINT[slot]}
                  </p>
                </div>
                {state !== "ready" ? (
                  uploadType ? (
                    <Button
                      size="sm"
                      variant="primary"
                      aria-label={`Add ${APPLICATION_SLOT_LABELS[slot]}`}
                      onPress={() => onAddDocument(uploadType)}
                    >
                      <IconPlus size={16} aria-hidden="true" />
                      Add
                    </Button>
                  ) : (
                    <Link href="/verify" className="text-sm font-medium text-primary hover:underline">
                      Verify
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
