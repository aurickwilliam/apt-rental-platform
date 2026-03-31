"use client";
import { Textarea } from "@heroui/react";
import { PERKS } from "../../../../components/inputs/perks";
import type { ApartmentFormData, FormErrors } from "../page";

interface Props {
  formData: ApartmentFormData;
  updateForm: (updates: Partial<ApartmentFormData>) => void;
  errors: FormErrors;
}

export default function Step4Description({ formData, updateForm, errors }: Props) {
  const toggleAmenity = (id: string) => {
    const current = formData.amenities;
    if (current.includes(id)) {
      updateForm({ amenities: current.filter((a) => a !== id) });
    } else {
      updateForm({ amenities: [...current, id] });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-medium font-noto-serif text-primary mb-1">
          Description & Amenities
        </h2>
        <p className="text-grey-500 text-sm">
          Describe your property and highlight what makes it special.
        </p>
      </div>

      <Textarea
        label="Description"
        placeholder="Tell tenants about the property — location highlights, nearby establishments, house rules, what's included, etc."
        value={formData.description}
        onValueChange={(v) => updateForm({ description: v })}
        radius="lg"
        variant="bordered"
        minRows={6}
        maxRows={12}
        description={`${formData.description.length} characters`}
        isInvalid={!!errors.description}
        errorMessage={errors.description}
        classNames={{
          inputWrapper: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
        }}
      />

      {/* Amenities picker */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className={`text-sm font-semibold ${errors.amenities ? "text-danger" : "text-grey-700"}`}>
            Amenities <span className="text-danger">*</span>
          </p>
          {formData.amenities.length > 0 && (
            <p className="text-xs text-primary font-medium">
              {formData.amenities.length} selected
            </p>
          )}
        </div>

        <div
          className={`grid grid-cols-2 gap-2.5 p-3 rounded-2xl border-2 transition ${
            errors.amenities ? "border-danger bg-danger/5" : "border-transparent"
          }`}
        >
          {Object.values(PERKS).map((perk) => {
            const Icon = perk.icon;
            const selected = formData.amenities.includes(perk.id);
            return (
              <button
                key={perk.id}
                type="button"
                onClick={() => toggleAmenity(perk.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer text-left ${
                  selected
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-grey-200 hover:border-grey-300 text-grey-700"
                }`}
              >
                <Icon
                  size={18}
                  className={`shrink-0 ${selected ? "text-primary" : "text-grey-500"}`}
                />
                <span className="text-sm font-medium leading-tight">{perk.name}</span>
              </button>
            );
          })}
        </div>

        {errors.amenities && (
          <p className="text-danger text-xs mt-1.5">{errors.amenities}</p>
        )}
      </div>
    </div>
  );
}
