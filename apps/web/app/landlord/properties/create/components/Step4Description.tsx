"use client";
import { useMemo, useState } from "react";
import { Description, FieldError, InputGroup, Label, TextArea, TextField } from "@heroui/react";
import { IconSearch } from "@tabler/icons-react";
import { isRetiredAmenity, toggleAmenitySelection } from "@repo/constants";
import { PERKS } from "../../../../components/inputs/perks";
import type { ApartmentFormData, FormErrors } from "../page";

interface Props {
  formData: ApartmentFormData;
  updateForm: (updates: Partial<ApartmentFormData>) => void;
  errors: FormErrors;
}

export default function Step4Description({ formData, updateForm, errors }: Props) {
  const [amenitySearch, setAmenitySearch] = useState("");

  const visiblePerks = useMemo(() => {
    const query = amenitySearch.toLowerCase().trim();
    return Object.values(PERKS).filter(
      (perk) =>
        // Retired perks (e.g. Furnished: use Furnished Type) only stay if picked.
        (!isRetiredAmenity(perk.id) || formData.amenities.includes(perk.id)) &&
        (query === "" || perk.name.toLowerCase().includes(query)),
    );
  }, [amenitySearch, formData.amenities]);

  const toggleAmenity = (id: string) => {
    // Picking an amenity turns off any it contradicts (e.g. No Cooking vs Kitchen).
    updateForm({ amenities: toggleAmenitySelection(formData.amenities, id) });
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-medium font-noto-serif text-primary mb-1">
          Description & Amenities
        </h2>
        <p className="text-muted-foreground text-sm">
          Describe your property and highlight what makes it special.
        </p>
      </div>

      <TextField 
        isInvalid={!!errors.description} 
        className="w-full"
      >
        <Label>Description <span className="text-danger">*</span></Label>
        
        <TextArea
          placeholder="Tell tenants about the property — location highlights, nearby establishments, house rules, what's included, etc."
          value={formData.description}
          onChange={(e) => updateForm({ description: e.target.value })}
          variant="primary"
          rows={6}
          className="w-full rounded-lg border border-border bg-card text-foreground shadow-none outline-none ring-0 placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/20 data-[focus-visible=true]:border-primary data-[focus-visible=true]:ring-1 data-[focus-visible=true]:ring-primary/20"
        />

        {/* Description / Character counter slot */}
        <Description className="text-muted-foreground">{`${formData.description.length} characters`}</Description>
        
        {/* Error feedback slot */}
        <FieldError>{errors.description}</FieldError>
      </TextField>

      {/* Amenities picker */}
      <div>
        <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-semibold ${errors.amenities ? "text-danger" : "text-foreground"}`}>
              Amenities <span className="text-danger">*</span>
            </p>
            {formData.amenities.length > 0 && (
              <p className="text-xs text-primary font-medium">
                {formData.amenities.length} selected
              </p>
            )}
          </div>
          <TextField aria-label="Search amenities" className="w-full sm:max-w-xs">
            <InputGroup className="rounded-xl border border-border bg-card transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
              <InputGroup.Prefix>
                <IconSearch size={16} className="text-muted-foreground shrink-0" />
              </InputGroup.Prefix>
              <InputGroup.Input
                placeholder="Search amenities..."
                value={amenitySearch}
                onChange={(e) => setAmenitySearch(e.target.value)}
                className="bg-transparent text-foreground placeholder:text-muted-foreground"
              />
            </InputGroup>
          </TextField>
        </div>

        <p className="text-xs text-muted-foreground mb-3">
          Some amenities can&apos;t go together, like No Cooking Allowed and Kitchen. Picking one removes the other.
        </p>

        <div
          className={`grid grid-cols-2 gap-2.5 p-3 rounded-2xl border-2 transition ${
            errors.amenities ? "border-danger bg-danger/5" : "border-transparent"
          }`}
        >
          {visiblePerks.length === 0 ? (
            <p className="col-span-2 text-center text-sm text-muted-foreground py-4">
              No amenities match &ldquo;{amenitySearch.trim()}&rdquo;.
            </p>
          ) : (
            visiblePerks.map((perk) => {
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
                    : "border-border hover:border-primary/50 text-foreground"
                }`}
              >
                <Icon
                  size={18}
                  className={`shrink-0 ${selected ? "text-primary" : "text-muted-foreground"}`}
                />
                <span className="text-sm font-medium leading-tight">{perk.name}</span>
              </button>
            );
            })
          )}
        </div>

        {errors.amenities && (
          <p className="text-danger text-xs mt-1.5">{errors.amenities}</p>
        )}
      </div>
    </div>
  );
}
