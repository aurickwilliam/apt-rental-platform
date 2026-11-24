"use client";

import { useState } from "react";
import Link from "next/link";
import { FieldError, Input, Label, ListBox, Select, Separator, TextField } from "@heroui/react";

import { handlePesoChange } from "@repo/utils";
import {
  EMPLOYMENT_TYPES,
  PH_MOBILE_MAX_INPUT_LENGTH,
  REQUIRES_OCCUPATION_TYPES,
  formatPHMobileInput,
  requiresProofOfIncome,
  type EmploymentType,
} from "@repo/constants";

import { EMPLOYMENT_TYPE_KEYS, enumLabel, formatDate, type TranslationKey } from "@repo/i18n";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import FormStepActions from "@/app/components/layout/FormStepActions";

import { employmentRules, validatePHMobile } from "../../lib/validate-application";
import type { ApplicationStepProps } from "../../types";

const INPUT_CLASS = "bg-card border-border text-card-foreground placeholder:text-muted-foreground";
const READ_ONLY_INPUT_CLASS = "bg-muted border-border text-card-foreground placeholder:text-muted-foreground cursor-default";

// Filled from the profile and read-only, as on mobile.
const PERSONAL_FIELDS: {
  key: "fullName" | "email" | "dateOfBirth" | "contactNumber" | "currentAddress";
  labelKey: TranslationKey;
  emptyKey: TranslationKey;
  wide?: boolean;
}[] = [
  { key: "fullName", labelKey: "apply.field.fullName", emptyKey: "apply.empty.fullName" },
  { key: "email", labelKey: "apply.field.email", emptyKey: "apply.empty.email" },
  { key: "dateOfBirth", labelKey: "apply.field.dateOfBirth", emptyKey: "apply.empty.dateOfBirth" },
  { key: "contactNumber", labelKey: "apply.field.contactNumber", emptyKey: "apply.empty.contactNumber" },
  {
    key: "currentAddress",
    labelKey: "apply.field.currentAddress",
    emptyKey: "apply.empty.currentAddress",
    wide: true,
  },
];

function formatBirthDate(value: string, language: "en" | "fil"): string {
  if (!value) return "";
  return formatDate(`${value}T00:00:00`, "long", language);
}

interface TenantInfoStepProps extends ApplicationStepProps {
  onBack: () => void;
  onNext: () => void;
}

export default function TenantInfoStep({ form, errors, onChange, clearError, onBack, onNext }: TenantInfoStepProps) {
  const { language, t } = useTranslation();
  const { isNoIncomeType, requiresOccupation, requiresCompany } = employmentRules(form.employmentType);
  // Like Complete Profile, the number is checked once the field is left and
  // the message then follows the typing. Blank passes: the field is optional.
  const [contactTouched, setContactTouched] = useState(false);
  const contactError =
    errors.prevLandlordContact ??
    (contactTouched ? validatePHMobile(form.prevLandlordContact).errorMessage : undefined);

  return (
    <div>
      <h2 className="font-nunito text-lg font-semibold text-foreground">{t("apply.tenant.personalTitle")}</h2>
      <p className="mb-5 text-xs text-muted-foreground">
        {t("apply.tenant.personalHintBefore")}{" "}
        <Link href="/tenant/profile" className="font-medium text-primary hover:underline">
          {t("apply.tenant.personalHintLink")}
        </Link>
        {t("apply.tenant.personalHintAfter")}
      </p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {PERSONAL_FIELDS.map(({ key, labelKey, emptyKey, wide }) => (
          <TextField
            key={key}
            isReadOnly
            isRequired
            isInvalid={!!errors[key]}
            value={key === "dateOfBirth" ? formatBirthDate(form.dateOfBirth, language) : form[key]}
            className={wide ? "md:col-span-2" : undefined}
          >
            <Label>{t(labelKey)}</Label>
            <Input placeholder={t(emptyKey)} className={READ_ONLY_INPUT_CLASS} />
            <FieldError>{errors[key]}</FieldError>
          </TextField>
        ))}
      </div>

      <Separator className="my-6" />
      <h2 className="mb-4 font-nunito text-lg font-semibold text-foreground">{t("apply.tenant.employmentTitle")}</h2>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Select
          isRequired
          placeholder={t("apply.tenant.employmentPlaceholder")}
          value={form.employmentType || null}
          onChange={(key) => {
            const value = key ? String(key) : "";
            const patch: Parameters<typeof onChange>[0] = { employmentType: value };
            clearError("employmentType");
            if (value && !REQUIRES_OCCUPATION_TYPES.includes(value as EmploymentType)) clearError("occupation");
            if (value && !requiresProofOfIncome(value)) {
              patch.companyName = "";
              clearError("companyName");
              clearError("monthlyIncome");
            }
            onChange(patch);
          }}
          isInvalid={!!errors.employmentType}
        >
          <Label>{t("apply.tenant.employmentType")}</Label>
          <Select.Trigger className="border-border bg-card text-card-foreground">
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {EMPLOYMENT_TYPES.map((type) => (
                <ListBox.Item key={type} id={type} textValue={enumLabel(language, EMPLOYMENT_TYPE_KEYS, type)}>
                  {enumLabel(language, EMPLOYMENT_TYPE_KEYS, type)}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
          <FieldError>{errors.employmentType}</FieldError>
        </Select>

        <TextField
          isRequired={requiresOccupation}
          isInvalid={!!errors.occupation}
          value={form.occupation}
          onChange={(value: string) => {
            onChange({ occupation: value });
            if (value.trim()) clearError("occupation");
          }}
        >
          <Label>{t("apply.tenant.occupation")}</Label>
          <Input placeholder={t("apply.tenant.occupationPlaceholder")} className={INPUT_CLASS} />
          <FieldError>{errors.occupation}</FieldError>
        </TextField>

        <TextField
          isRequired={requiresCompany}
          isInvalid={!!errors.companyName}
          isDisabled={isNoIncomeType}
          value={isNoIncomeType ? "" : form.companyName}
          onChange={(value: string) => {
            onChange({ companyName: value });
            if (value.trim()) clearError("companyName");
          }}
        >
          <Label>{t("apply.tenant.company")}</Label>
          <Input placeholder={isNoIncomeType ? t("apply.tenant.companyNotApplicable") : t("apply.tenant.companyPlaceholder")} className={INPUT_CLASS} />
          <FieldError>{errors.companyName}</FieldError>
        </TextField>

        <TextField
          isRequired
          isInvalid={!!errors.monthlyIncome}
          value={form.monthlyIncomeText}
          onChange={(value: string) => {
            const { raw, formatted } = handlePesoChange(value);
            const parsed = raw === "" || raw === "." ? null : parseFloat(raw);
            onChange({ monthlyIncomeText: formatted, monthlyIncome: parsed });
            if (parsed !== null && parsed >= 0 && (isNoIncomeType || parsed > 0)) clearError("monthlyIncome");
          }}
        >
          <Label>{t("apply.tenant.income")}</Label>
          <Input
            placeholder={isNoIncomeType ? t("apply.tenant.incomePlaceholderNoIncome") : t("apply.tenant.incomePlaceholder")}
            inputMode="decimal"
            className={INPUT_CLASS}
          />
          <FieldError>{errors.monthlyIncome}</FieldError>
        </TextField>
      </div>

      <Separator className="my-6" />
      <h2 className="font-nunito text-lg font-semibold text-foreground">{t("apply.tenant.referencesTitle")}</h2>
      <p className="mb-4 text-xs text-muted-foreground">{t("apply.tenant.referencesHint")}</p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <TextField
          isInvalid={!!errors.prevLandlordName}
          value={form.prevLandlordName}
          onChange={(value: string) => {
            onChange({ prevLandlordName: value });
            if (value.trim()) clearError("prevLandlordName");
          }}
        >
          <Label>{t("apply.tenant.prevLandlordName")}</Label>
          <Input placeholder={t("apply.tenant.prevLandlordNamePlaceholder")} className={INPUT_CLASS} />
          <FieldError>{errors.prevLandlordName}</FieldError>
        </TextField>
        <TextField
          isInvalid={!!contactError}
          value={form.prevLandlordContact}
          onChange={(value: string) => {
            // Same live formatting as Complete Profile: "0917 123 4567".
            onChange({ prevLandlordContact: formatPHMobileInput(value) });
            clearError("prevLandlordContact");
          }}
          onBlur={() => setContactTouched(true)}
        >
          <Label>{t("apply.tenant.prevLandlordContact")}</Label>
          <Input
            inputMode="tel"
            placeholder="09XX XXX XXXX"
            maxLength={PH_MOBILE_MAX_INPUT_LENGTH}
            className={INPUT_CLASS}
          />
          <FieldError>{contactError}</FieldError>
        </TextField>
      </div>

      <FormStepActions isFirstStep onBack={onBack} onContinue={onNext} />
    </div>
  );
}
