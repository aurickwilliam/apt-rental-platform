"use client";
import { NumberInput } from "@heroui/react";
import type { ApartmentFormData, FormErrors } from "../page";

interface Props {
  formData: ApartmentFormData;
  updateForm: (updates: Partial<ApartmentFormData>) => void;
  errors: FormErrors;
}

export default function Step3Pricing({ formData, updateForm, errors }: Props) {
  const total = formData.monthly_rent + formData.security_deposit + formData.advance_rent;

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
        <NumberInput
          label="Monthly Rent"
          type="number"
          minValue={0}
          value={formData.monthly_rent}
          onValueChange={(value) => updateForm({ monthly_rent: value })}
          radius="lg"
          variant="bordered"
          startContent={
            <span className="text-grey-400 text-sm pointer-events-none">₱</span>
          }
          description="The base monthly rental rate tenants will see on the listing."
          hideStepper
          isInvalid={!!errors.monthly_rent}
          errorMessage={errors.monthly_rent}
          classNames={{
            inputWrapper: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
          }}
        />

        <NumberInput
          label="Security Deposit"
          type="number"
          minValue={0}
          value={formData.security_deposit}
          onValueChange={(value) => updateForm({ security_deposit: value })}
          radius="lg"
          variant="bordered"
          startContent={
            <span className="text-grey-400 text-sm pointer-events-none">₱</span>
          }
          description="Typically 1–2 months of rent. Refundable upon move-out."
          hideStepper
          isInvalid={!!errors.security_deposit}
          errorMessage={errors.security_deposit}
          classNames={{
            inputWrapper: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
          }}
        />

        <NumberInput
          label="Advance Rent"
          type="number"
          minValue={0}
          value={formData.advance_rent}
          onValueChange={(value) => updateForm({ advance_rent: value })}
          radius="lg"
          variant="bordered"
          startContent={
            <span className="text-grey-400 text-sm pointer-events-none">₱</span>
          }
          description="Payment made upfront, typically applied to the first or last month(s) of the lease."
          hideStepper
          isInvalid={!!errors.advance_rent}
          errorMessage={errors.advance_rent}
          classNames={{
            inputWrapper: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
          }}
        />
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
    </div>
  );
}
