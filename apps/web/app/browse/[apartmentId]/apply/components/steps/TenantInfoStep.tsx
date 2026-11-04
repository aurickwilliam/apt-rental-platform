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

import FormStepActions from "@/app/components/layout/FormStepActions";

import { employmentRules, validatePHMobile } from "../../lib/validate-application";
import type { ApplicationStepProps } from "../../types";

const INPUT_CLASS = "bg-card border-border text-card-foreground placeholder:text-muted-foreground";
const READ_ONLY_INPUT_CLASS = "bg-muted border-border text-card-foreground placeholder:text-muted-foreground cursor-default";

// Filled from the profile and read-only, as on mobile.
const PERSONAL_FIELDS: {
  key: "fullName" | "email" | "dateOfBirth" | "contactNumber" | "currentAddress";
  label: string;
  emptyLabel: string;
  wide?: boolean;
}[] = [
  { key: "fullName", label: "Full Name", emptyLabel: "No full name on file" },
  { key: "email", label: "Email", emptyLabel: "No email on file" },
  { key: "dateOfBirth", label: "Date of Birth", emptyLabel: "No date of birth on file" },
  { key: "contactNumber", label: "Contact Number", emptyLabel: "No contact number on file" },
  { key: "currentAddress", label: "Current Address", emptyLabel: "No current address on file", wide: true },
];

function formatBirthDate(value: string): string {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
}

interface TenantInfoStepProps extends ApplicationStepProps {
  onBack: () => void;
  onNext: () => void;
}

export default function TenantInfoStep({ form, errors, onChange, clearError, onBack, onNext }: TenantInfoStepProps) {
  const { isNoIncomeType, requiresOccupation, requiresCompany } = employmentRules(form.employmentType);
  // Like Complete Profile, the number is checked once the field is left and
  // the message then follows the typing. Blank passes: the field is optional.
  const [contactTouched, setContactTouched] = useState(false);
  const contactError =
    errors.prevLandlordContact ??
    (contactTouched ? validatePHMobile(form.prevLandlordContact).errorMessage : undefined);

  return (
    <div>
      <h2 className="font-nunito text-lg font-semibold text-foreground">Personal Information</h2>
      <p className="mb-5 text-xs text-muted-foreground">
        From your profile. To change these, update your{" "}
        <Link href="/tenant/profile" className="font-medium text-primary hover:underline">
          profile
        </Link>
        .
      </p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {PERSONAL_FIELDS.map(({ key, label, emptyLabel, wide }) => (
          <TextField
            key={key}
            isReadOnly
            isRequired
            isInvalid={!!errors[key]}
            value={key === "dateOfBirth" ? formatBirthDate(form.dateOfBirth) : form[key]}
            className={wide ? "md:col-span-2" : undefined}
          >
            <Label>{label}</Label>
            <Input placeholder={emptyLabel} className={READ_ONLY_INPUT_CLASS} />
            <FieldError>{errors[key]}</FieldError>
          </TextField>
        ))}
      </div>

      <Separator className="my-6" />
      <h2 className="mb-4 font-nunito text-lg font-semibold text-foreground">Employment & Income Details</h2>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Select
          isRequired
          placeholder="Select your employment type"
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
          <Label>Employment Type</Label>
          <Select.Trigger className="border-border bg-card text-card-foreground">
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {EMPLOYMENT_TYPES.map((type) => (
                <ListBox.Item key={type} id={type} textValue={type}>
                  {type}
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
          <Label>Occupation / Job Title</Label>
          <Input placeholder="Enter your occupation" className={INPUT_CLASS} />
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
          <Label>Company Name</Label>
          <Input placeholder={isNoIncomeType ? "Not applicable" : "Enter your company name"} className={INPUT_CLASS} />
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
          <Label>Monthly Income</Label>
          <Input
            placeholder={isNoIncomeType ? "Enter 0 if no income" : "Enter your monthly income"}
            inputMode="decimal"
            className={INPUT_CLASS}
          />
          <FieldError>{errors.monthlyIncome}</FieldError>
        </TextField>
      </div>

      <Separator className="my-6" />
      <h2 className="font-nunito text-lg font-semibold text-foreground">References</h2>
      <p className="mb-4 text-xs text-muted-foreground">Preferred for fast-track review</p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <TextField
          isInvalid={!!errors.prevLandlordName}
          value={form.prevLandlordName}
          onChange={(value: string) => {
            onChange({ prevLandlordName: value });
            if (value.trim()) clearError("prevLandlordName");
          }}
        >
          <Label>Previous Landlord Name</Label>
          <Input placeholder="Enter previous landlord name" className={INPUT_CLASS} />
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
          <Label>Previous Landlord Contact</Label>
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
