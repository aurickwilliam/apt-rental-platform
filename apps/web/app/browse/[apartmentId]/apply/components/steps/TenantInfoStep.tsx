"use client";

import Link from "next/link";
import { Button, Card, FieldError, Input, Label, ListBox, Select, Separator, TextField } from "@heroui/react";

import { handlePesoChange } from "@repo/utils";
import { EMPLOYMENT_TYPES, REQUIRES_OCCUPATION_TYPES, requiresProofOfIncome, type EmploymentType } from "@repo/constants";

import { employmentRules } from "../../lib/validate-application";
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

  return (
    <Card className="border border-border bg-card p-5 text-card-foreground shadow-none md:p-8">
      <h2 className="text-lg font-semibold text-card-foreground">Personal Information</h2>
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
      <h3 className="mb-4 text-base font-semibold text-card-foreground">Employment & Income Details</h3>
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
      <h3 className="text-base font-semibold text-card-foreground">References</h3>
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
          isInvalid={!!errors.prevLandlordContact}
          value={form.prevLandlordContact}
          onChange={(value: string) => {
            onChange({ prevLandlordContact: value });
            clearError("prevLandlordContact");
          }}
        >
          <Label>Previous Landlord Contact</Label>
          <Input placeholder="09XXXXXXXXX" className={INPUT_CLASS} />
          <FieldError>{errors.prevLandlordContact}</FieldError>
        </TextField>
      </div>

      <div className="mt-8 flex gap-3">
        <Button variant="outline" className="flex-1" onPress={onBack}>
          Back
        </Button>
        <Button className="flex-1" onPress={onNext}>
          Next
        </Button>
      </div>
    </Card>
  );
}
