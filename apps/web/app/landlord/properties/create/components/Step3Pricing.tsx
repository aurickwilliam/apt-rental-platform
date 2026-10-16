"use client";
import { useRef } from "react";
import { NumberField, Button, Label, Description, FieldError, Select, ListBox } from "@heroui/react";
import { IconFileText, IconUpload, IconX } from "@tabler/icons-react";
import {
  ADVANCE_RENT_MONTH_OPTIONS,
  MAX_RENT_DUE_DAY,
  MIN_MONTHLY_RENT,
  MIN_RENT_DUE_DAY,
  SECURITY_DEPOSIT_MONTH_OPTIONS,
  formatPricingMonths,
  pricingAmountFromMonths,
} from "@repo/utils";
import type { ApartmentFormData, FormErrors } from "../page";

interface Props {
  formData: ApartmentFormData;
  updateForm: (updates: Partial<ApartmentFormData>) => void;
  errors: FormErrors;
}

export default function Step3Pricing({ formData, updateForm, errors }: Props) {
  const securityDepositAmount = pricingAmountFromMonths(formData.monthly_rent, formData.security_deposit_months);
  const advanceRentAmount = pricingAmountFromMonths(formData.monthly_rent, formData.advance_rent_months);
  const total = formData.monthly_rent + securityDepositAmount + advanceRentAmount;
  const leaseAgreementRef = useRef<HTMLInputElement>(null);

  const handleLeaseAgreement = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) updateForm({ lease_agreement: file });
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-medium font-nunito text-primary mb-1">
          Pricing
        </h2>
        <p className="text-muted-foreground text-sm">
          Set your rental rate and required deposit.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <NumberField
          minValue={MIN_MONTHLY_RENT}
          value={formData.monthly_rent}
          onChange={(value) => updateForm({ monthly_rent: value })}
          isInvalid={!!errors.monthly_rent}
        >
          <Label>Monthly Rent</Label>
          <NumberField.Group className="rounded-lg border border-border focus-within:border-primary! focus-within:border-2! px-3 flex items-center gap-2 bg-card">
            <span className="text-muted-foreground text-sm pointer-events-none">₱</span>
            <NumberField.Input className="w-full bg-transparent text-foreground" />
          </NumberField.Group>
          <Description className="text-muted-foreground">
            The base monthly rental rate tenants will see on the listing.
          </Description>
          <FieldError>{errors.monthly_rent}</FieldError>
        </NumberField>

        <NumberField
          minValue={MIN_RENT_DUE_DAY}
          maxValue={MAX_RENT_DUE_DAY}
          step={1}
          value={formData.rent_due_day}
          onChange={(value) => updateForm({ rent_due_day: value })}
          isInvalid={!!errors.rent_due_day}
        >
          <Label>Rent Due Day</Label>
          <NumberField.Group className="rounded-lg border border-border focus-within:border-primary! focus-within:border-2! px-3 flex items-center gap-2 bg-card">
            <NumberField.Input className="w-full bg-transparent text-foreground" />
          </NumberField.Group>
          <Description className="text-muted-foreground">
            Day of the month rent is due ({MIN_RENT_DUE_DAY}–{MAX_RENT_DUE_DAY}). Shorter months use their last day.
          </Description>
          <FieldError>{errors.rent_due_day}</FieldError>
        </NumberField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Select
            placeholder="Select months"
            value={String(formData.security_deposit_months)}
            onChange={(value) => updateForm({ security_deposit_months: Number(value) })}
            isInvalid={!!errors.security_deposit_months}
            className="w-full"
          >
            <Label>Security Deposit</Label>
            <Select.Trigger className="rounded-lg border border-border bg-card cursor-pointer focus-visible:border-primary data-[open=true]:border-primary">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <FieldError>{errors.security_deposit_months}</FieldError>
            <Select.Popover className="create-listing-options font-inter">
              <ListBox>
                {SECURITY_DEPOSIT_MONTH_OPTIONS.map((months) => ({ value: months, label: formatPricingMonths(months) })).map((option) => (
                  <ListBox.Item key={option.value} id={String(option.value)} textValue={option.label} className="text-foreground rounded-lg hover:bg-muted! data-[focus-visible=true]:bg-muted data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary">
                    {option.label}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
          <p className="text-muted-foreground text-xs mt-1">Optional — 1 to 2 months of rent. Refundable upon move-out.</p>
        </div>

        <div>
          <Select
            placeholder="Select months"
            value={String(formData.advance_rent_months)}
            onChange={(value) => updateForm({ advance_rent_months: Number(value) })}
            isInvalid={!!errors.advance_rent_months}
            className="w-full"
          >
            <Label>Advance Rent</Label>
            <Select.Trigger className="rounded-lg border border-border bg-card cursor-pointer focus-visible:border-primary data-[open=true]:border-primary">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <FieldError>{errors.advance_rent_months}</FieldError>
            <Select.Popover className="create-listing-options font-inter">
              <ListBox>
                {ADVANCE_RENT_MONTH_OPTIONS.map((months) => ({ value: months, label: formatPricingMonths(months) })).map((option) => (
                  <ListBox.Item key={option.value} id={String(option.value)} textValue={option.label} className="text-foreground rounded-lg hover:bg-muted! data-[focus-visible=true]:bg-muted data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary">
                    {option.label}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
          <p className="text-muted-foreground text-xs mt-1">Optional — up to 1 month of rent, applied to the first or last month(s).</p>
        </div>
      </div>
      </div>

      {/* Move-in cost summary — only show when values are set */}
      {formData.monthly_rent > 0 && (
        <div className="bg-muted border border-border rounded-2xl p-5 flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground">
            Estimated Move-in Cost
          </h3>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Rent</span>
              <span className="font-medium">
                ₱ {formData.monthly_rent.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Security Deposit</span>
              <span className="font-medium">
                ₱ {securityDepositAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Advance Rent</span>
              <span className="font-medium">
                ₱ {advanceRentAmount.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="border-t border-border pt-3 flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span className="text-primary">₱ {total.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Lease Agreement Upload */}
      <div>
        <h3 className="text-sm font-medium mb-1">
          Lease Agreement Document <span className="text-danger">*</span>
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Upload a sample lease agreement for potential tenants to review. (PDF or DOCX)
        </p>

        <input
          ref={leaseAgreementRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={handleLeaseAgreement}
        />

        {formData.lease_agreement ? (
          <div className="flex items-center justify-between p-4 border border-primary/20 bg-primary/5 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <IconFileText size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground line-clamp-1">
                  {formData.lease_agreement.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {Math.round(formData.lease_agreement.size / 1024)} KB
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="tertiary"
                onPress={() => leaseAgreementRef.current?.click()}
              >
                Change
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="danger-soft"
                onPress={() => updateForm({ lease_agreement: null })}
              >
                <IconX size={16} />
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={`w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition ${
              errors.lease_agreement
                ? "border-danger bg-danger/5"
                : "border-border hover:border-primary hover:bg-primary/5"
            }`}
            onClick={() => leaseAgreementRef.current?.click()}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <IconUpload size={18} className="text-primary" />
            </div>
            <p className="text-foreground font-medium text-sm">Click to upload doc</p>
            <p className="text-muted-foreground text-xs mt-1">PDF, DOCX up to 10MB</p>
          </div>
        )}

        {/* Error message below the upload box */}
        {errors.lease_agreement && (
          <p className="text-danger text-xs mt-1.5">{errors.lease_agreement}</p>
        )}
      </div>
    </div>
  );
}
