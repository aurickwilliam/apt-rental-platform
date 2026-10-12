"use client";

import { Button, Card, FieldError, Input, Label, ListBox, Select, Separator, TextField } from "@heroui/react";

import { handlePesoChange } from "@repo/utils";
import { EMPLOYMENT_TYPES, REQUIRES_OCCUPATION_TYPES, requiresProofOfIncome, type EmploymentType } from "@repo/constants";

import { employmentRules } from "../../lib/validate-application";
import type { ApplicationStepProps } from "../../types";

const INPUT_CLASS = "bg-card border-border text-card-foreground placeholder:text-muted-foreground";

interface TenantInfoStepProps extends ApplicationStepProps {
  onBack: () => void;
  onNext: () => void;
}

export default function TenantInfoStep({ form, errors, onChange, clearError, onBack, onNext }: TenantInfoStepProps) {
  const { isNoIncomeType, requiresOccupation, requiresCompany } = employmentRules(form.employmentType);

  return (
    <Card className="border border-border bg-card p-5 text-card-foreground shadow-none md:p-8">
      <h2 className="text-lg font-semibold text-card-foreground">Personal Information</h2>
      <p className="mb-5 text-xs text-muted-foreground">All fields are editable. Please ensure accuracy.</p>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <TextField
          isRequired
          isInvalid={!!errors.fullName}
          value={form.fullName}
          onChange={(value: string) => {
            onChange({ fullName: value });
            if (value.trim()) clearError("fullName");
          }}
        >
          <Label>Full Name</Label>
          <Input placeholder="Enter your full name" className={INPUT_CLASS} />
          <FieldError>{errors.fullName}</FieldError>
        </TextField>
        <TextField
          isRequired
          isInvalid={!!errors.email}
          value={form.email}
          onChange={(value: string) => {
            onChange({ email: value });
            if (value.trim()) clearError("email");
          }}
        >
          <Label>Email</Label>
          <Input placeholder="Enter your email" inputMode="email" className={INPUT_CLASS} />
          <FieldError>{errors.email}</FieldError>
        </TextField>
        <TextField
          isRequired
          isInvalid={!!errors.dateOfBirth}
          value={form.dateOfBirth}
          onChange={(value: string) => {
            onChange({ dateOfBirth: value });
            if (value) clearError("dateOfBirth");
          }}
        >
          <Label>Date of Birth</Label>
          <Input type="date" className={INPUT_CLASS} />
          <FieldError>{errors.dateOfBirth}</FieldError>
        </TextField>
        <TextField
          isRequired
          isInvalid={!!errors.contactNumber}
          value={form.contactNumber}
          onChange={(value: string) => {
            onChange({ contactNumber: value });
            clearError("contactNumber");
          }}
        >
          <Label>Contact Number</Label>
          <Input placeholder="09XXXXXXXXX" inputMode="numeric" className={INPUT_CLASS} />
          <FieldError>{errors.contactNumber}</FieldError>
        </TextField>
        <div className="md:col-span-2">
          <TextField
            isRequired
            isInvalid={!!errors.currentAddress}
            value={form.currentAddress}
            onChange={(value: string) => {
              onChange({ currentAddress: value });
              if (value.trim()) clearError("currentAddress");
            }}
          >
            <Label>Current Address</Label>
            <Input placeholder="Street, Barangay, City, Province" className={INPUT_CLASS} />
            <FieldError>{errors.currentAddress}</FieldError>
          </TextField>
        </div>
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
