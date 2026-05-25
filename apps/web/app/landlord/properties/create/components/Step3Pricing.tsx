"use client";
import { useRef } from "react";
import { NumberField, Button, Label, Description, FieldError } from "@heroui/react";
import { Upload, X, FileText } from "lucide-react";
import type { ApartmentFormData, FormErrors } from "../page";

interface Props {
  formData: ApartmentFormData;
  updateForm: (updates: Partial<ApartmentFormData>) => void;
  errors: FormErrors;
}

export default function Step3Pricing({ formData, updateForm, errors }: Props) {
  const total = formData.monthly_rent + formData.security_deposit + formData.advance_rent;
  const leaseAgreementRef = useRef<HTMLInputElement>(null);

  const handleLeaseAgreement = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) updateForm({ lease_agreement: file });
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-medium font-noto-serif text-primary mb-1">
          Pricing
        </h2>
        <p className="text-grey-500 text-sm">
          Set your rental rate and required deposit.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <NumberField
          minValue={0}
          value={formData.monthly_rent}
          onChange={(value) => updateForm({ monthly_rent: value })}
          isInvalid={!!errors.monthly_rent}
        >
          <Label>Monthly Rent</Label>
          <NumberField.Group className="rounded-lg border border-grey-300 focus-within:border-primary! focus-within:border-2! px-3 flex items-center gap-2">
            <span className="text-grey-400 text-sm pointer-events-none">₱</span>
            <NumberField.Input className="w-full" />
          </NumberField.Group>
          <Description className="text-grey-500">
            The base monthly rental rate tenants will see on the listing.
          </Description>
          <FieldError>{errors.monthly_rent}</FieldError>
        </NumberField>

        <NumberField
          minValue={0}
          value={formData.security_deposit}
          onChange={(value) => updateForm({ security_deposit: value })}
          isInvalid={!!errors.security_deposit}
        >
          <Label>Security Deposit</Label>
          <NumberField.Group className="rounded-lg border border-grey-300 focus-within:border-primary! focus-within:border-2! px-3 flex items-center gap-2">
            <span className="text-grey-400 text-sm pointer-events-none">₱</span>
            <NumberField.Input className="w-full" />
          </NumberField.Group>
          <Description className="text-grey-500">
            Typically 1–2 months of rent. Refundable upon move-out.
          </Description>
          <FieldError>{errors.security_deposit}</FieldError>
        </NumberField>

        <NumberField
          minValue={0}
          value={formData.advance_rent}
          onChange={(value) => updateForm({ advance_rent: value })}
          isInvalid={!!errors.advance_rent}
        >
          <Label>Advance Rent</Label>
          <NumberField.Group className="rounded-lg border border-grey-300 focus-within:border-primary! focus-within:border-2! px-3 flex items-center gap-2">
            <span className="text-grey-400 text-sm pointer-events-none">₱</span>
            <NumberField.Input className="w-full" />
          </NumberField.Group>
          <Description className=" text-grey-500">
            Payment made upfront, typically applied to the first or last month(s) of the lease.
          </Description>
          <FieldError>{errors.advance_rent}</FieldError>
        </NumberField>
      </div>

      {/* Move-in cost summary — only show when values are set */}
      {formData.monthly_rent > 0 && (
        <div className="bg-grey-50 border border-grey-200 rounded-2xl p-5 flex flex-col gap-3">
          <p className="text-sm font-semibold text-grey-700">
            Estimated Move-in Cost
          </p>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <span className="text-grey-500">Monthly Rent</span>
              <span className="font-medium">
                ₱ {formData.monthly_rent.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-grey-500">Security Deposit</span>
              <span className="font-medium">
                ₱ {formData.security_deposit.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-grey-500">Advance Rent</span>
              <span className="font-medium">
                ₱ {formData.advance_rent.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="border-t border-grey-200 pt-3 flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span className="text-primary">₱ {total.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Lease Agreement Upload */}
      <div>
        <p className="text-sm font-medium mb-1">
          Lease Agreement Document <span className="text-danger">*</span>
        </p>
        <p className="text-xs text-grey-500 mb-3">
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
                <FileText size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-grey-800 line-clamp-1">
                  {formData.lease_agreement.name}
                </span>
                <span className="text-xs text-grey-500">
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
                <X size={16} />
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={`w-full h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition ${
              errors.lease_agreement
                ? "border-danger bg-danger/5"
                : "border-grey-300 hover:border-primary hover:bg-primary/5"
            }`}
            onClick={() => leaseAgreementRef.current?.click()}
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Upload size={18} className="text-primary" />
            </div>
            <p className="text-grey-600 font-medium text-sm">Click to upload doc</p>
            <p className="text-grey-400 text-xs mt-1">PDF, DOCX up to 10MB</p>
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
