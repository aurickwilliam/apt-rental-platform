"use client";

import { IconShieldCheck } from "@tabler/icons-react";

import { getDocumentTypesForPortal, isReviewEligibleDocType, type PassportPortalRole } from "@repo/constants";
import { PASSPORT_DOC_TYPE_KEYS, enumLabel } from "@repo/i18n";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";

import { DocumentTypeIcon } from "./documentTypeIcons";
import { documentTypeDescriptionKey } from "./documentTypeCopy";
import { Button } from "@heroui/react";

interface DocumentTypePickerProps {
  portal: PassportPortalRole;
  /** Types already added: each type holds one document, replaced from its page. */
  addedDocTypes?: readonly string[];
  onSelect: (docType: string) => void;
}

export default function DocumentTypePicker({ portal, addedDocTypes = [], onSelect }: DocumentTypePickerProps) {
  const { language, t } = useTranslation();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {portal === "landlord" ? t("passport.picker.intro.landlord") : t("passport.picker.intro.tenant")}{" "}
        {t("passport.picker.reviewHintBefore")}{" "}
        <IconShieldCheck
          size={14}
          className="inline align-text-bottom text-success"
          aria-label={t("passport.picker.shieldLabel")}
        />{" "}
        {t("passport.picker.reviewHintAfter")}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {getDocumentTypesForPortal(portal).map((docType) => {
          const isAdded = addedDocTypes.includes(docType);
          return (
          <Button
            variant="ghost"
            key={docType}
            isDisabled={isAdded}
            onClick={() => onSelect(docType)}
            className="button--bare relative flex cursor-pointer items-start disabled:cursor-not-allowed disabled:opacity-60 gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-all duration-200 hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
              <DocumentTypeIcon docType={docType} size={20} />
            </span>
            <span className="min-w-0 pr-6">
              <span className="block font-nunito text-base font-semibold text-card-foreground">
                {enumLabel(language, PASSPORT_DOC_TYPE_KEYS, docType)}
              </span>
              <span className="block text-xs text-muted-foreground">
                {isAdded ? t("passport.picker.alreadyAdded") : t(documentTypeDescriptionKey(docType, portal))}
              </span>
            </span>
            {!isAdded && isReviewEligibleDocType(docType) ? (
              <span className="absolute top-3 right-3 text-success" title={t("passport.picker.canBeVerified")}>
                <IconShieldCheck size={18} aria-hidden="true" />
                <span className="sr-only">{t("passport.picker.canBeVerified")}</span>
              </span>
            ) : null}
          </Button>
          );
        })}
      </div>
    </div>
  );
}
