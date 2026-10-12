import { IconShieldCheck } from "@tabler/icons-react";

import { DOCUMENT_TYPES, isReviewEligibleDocType } from "@repo/constants";
import { getDocumentTypeDescription } from "@repo/passport";

import { DocumentTypeIcon } from "./documentTypeIcons";

interface DocumentTypePickerProps {
  onSelect: (docType: string) => void;
}

export default function DocumentTypePicker({ onSelect }: DocumentTypePickerProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Choose the type of document you want to add. Types with a{" "}
        <IconShieldCheck size={14} className="inline align-text-bottom text-success" aria-label="shield" /> can be sent
        for review after you add them. Your government ID is added automatically once your account
        verification is approved.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {DOCUMENT_TYPES.map((docType) => (
          <button
            key={docType}
            type="button"
            onClick={() => onSelect(docType)}
            className="relative flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-all duration-200 hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
              <DocumentTypeIcon docType={docType} size={20} />
            </span>
            <span className="min-w-0 pr-6">
              <span className="block font-nunito text-base font-semibold text-card-foreground">{docType}</span>
              <span className="block text-xs text-muted-foreground">{getDocumentTypeDescription(docType)}</span>
            </span>
            {isReviewEligibleDocType(docType) ? (
              <span className="absolute top-3 right-3 text-success" title="Can be verified">
                <IconShieldCheck size={18} aria-hidden="true" />
                <span className="sr-only">Can be verified</span>
              </span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
