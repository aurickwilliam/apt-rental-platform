"use client";

import Link from "next/link";
import { Button, Card, FieldError, Input, Label, ListBox, Select, Separator, TextField } from "@heroui/react";

import { handlePesoChange } from "@repo/utils";
import { EMPLOYMENT_TYPES, REQUIRES_OCCUPATION_TYPES, requiresProofOfIncome, type EmploymentType } from "@repo/constants";
import { EMPLOYMENT_TYPE_KEYS, enumLabel, formatDate, type TranslationKey } from "@repo/i18n";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";

import { employmentRules } from "../../lib/validate-application";
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

interface TenantInfoStepProps extends ApplicationStepProps {
  onBack: () => void;
  onNext: () => void;
}

export default function TenantInfoStep({ form, errors, onChange, clearError, onBack, onNext }: TenantInfoStepProps) {
  const { language, t } = useTranslation();
  const { isNoIncomeType, requiresOccupation, requiresCompany } = employmentRules(form.employmentType);

  const birthDate = form.dateOfBirth ? formatDate(`${form.dateOfBirth}T00:00:00`, "long", language) : "";

  return (
    <Card className="border border-border bg-card p-5 text-card-foreground shadow-none md:p-8">
      <h2 className="text-lg font-semibold text-card-foreground">{t("apply.tenant.personalTitle")}</h2>
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
            value={key === "dateOfBirth" ? birthDate : form[key]}
            className={wide ? "md:col-span-2" : undefined}
          >
            <Label>{t(labelKey)}</Label>
            <Input placeholder={t(emptyKey)} className={READ_ONLY_INPUT_CLASS} />
            <FieldError>{errors[key]}</FieldError>
          </TextField>
        ))}
      </div>

      <Separator className="my-6" />
      <h3 className="mb-4 text-base font-semibold text-card-foreground">{t("apply.tenant.employmentTitle")}</h3>
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
                <ListBox.Item key={type} id={type} textValue={type}>
                  {EMPLOYMENT_TYPE_KEYS[type] ? enumLabel(language, EMPLOYMENT_TYPE_KEYS, type) : type}
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
          <Input
            placeholder={
              isNoIncomeType
                ? t("apply.tenant.companyNotApplicable")
                : t("apply.tenant.companyPlaceholder")
            }
            className={INPUT_CLASS}
          />
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
            placeholder={
              isNoIncomeType
                ? t("apply.tenant.incomePlaceholderNoIncome")
                : t("apply.tenant.incomePlaceholder")
            }
            inputMode="decimal"
            className={INPUT_CLASS}
          />
          <FieldError>{errors.monthlyIncome}</FieldError>
        </TextField>
      </div>

      <Separator className="my-6" />
      <h3 className="text-base font-semibold text-card-foreground">{t("apply.tenant.referencesTitle")}</h3>
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
          isInvalid={!!errors.prevLandlordContact}
          value={form.prevLandlordContact}
          onChange={(value: string) => {
            onChange({ prevLandlordContact: value });
            clearError("prevLandlordContact");
          }}
        >
          <Label>{t("apply.tenant.prevLandlordContact")}</Label>
          <Input placeholder="09XX XXX XXXX" className={INPUT_CLASS} />
          <FieldError>{errors.prevLandlordContact}</FieldError>
        </TextField>
      </div>

      <div className="mt-8 flex gap-3">
        <Button variant="outline" className="flex-1" onPress={onBack}>
          {t("apply.back")}
        </Button>
        <Button className="flex-1" onPress={onNext}>
          {t("apply.next")}
        </Button>
      </div>
    </Card>
  );
}
