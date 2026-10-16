"use client";
import { useMemo, useState } from "react";
import { Button, Description, FieldError, Label, Modal, SearchField, Tag, TagGroup, TextArea, TextField } from "@heroui/react";
import { IconInfoCircle, IconSearch } from "@tabler/icons-react";
import { getConflictingAmenities, isRetiredAmenity, toggleAmenitySelection } from "@repo/constants";
import { PERKS } from "../../../../components/inputs/perks";
import { MAX_DESCRIPTION_LENGTH } from "@repo/constants";
import type { ApartmentFormData, FormErrors } from "../page";

interface Props {
  formData: ApartmentFormData;
  updateForm: (updates: Partial<ApartmentFormData>) => void;
  errors: FormErrors;
}

const nameOf = (id: string) => PERKS[id]?.name ?? id;
const AMENITY_RULES = ["no_cooking", "smoking"].map((id) => ({
  id,
  name: nameOf(id),
  blocks: getConflictingAmenities(id).map(nameOf).join(", "),
}));

export default function Step4Description({ formData, updateForm, errors }: Props) {
  const [amenitySearch, setAmenitySearch] = useState("");
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  const visiblePerks = useMemo(() => {
    const query = amenitySearch.toLowerCase().trim();
    return Object.values(PERKS).filter(
      (perk) =>
        !isRetiredAmenity(perk.id) &&
        !formData.amenities.includes(perk.id) &&
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
        <h2 className="text-2xl font-bold font-nunito text-primary mb-1">
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
          maxLength={MAX_DESCRIPTION_LENGTH}
          variant="primary"
          rows={6}
          className="w-full rounded-3xl border border-border bg-card text-foreground shadow-none outline-none ring-0 placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/20 data-[focus-visible=true]:border-primary data-[focus-visible=true]:ring-1 data-[focus-visible=true]:ring-primary/20"
        />

        {/* Description / Character counter slot */}
        <Description className="text-muted-foreground text-right">
          {`${formData.description.length.toLocaleString("en-PH")} / ${MAX_DESCRIPTION_LENGTH.toLocaleString("en-PH")}`}
        </Description>
        
        {/* Error feedback slot */}
        <FieldError>{errors.description}</FieldError>
      </TextField>

      {/* Amenities picker */}
      <div>
        <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h3 className={`text-sm font-semibold ${errors.amenities ? "text-danger" : "text-foreground"}`}>
              Amenities <span className="text-danger">*</span>
            </h3>
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              aria-label="Perks that can't go together"
              onPress={() => setIsRulesOpen(true)}
            >
              <IconInfoCircle size={20} />
            </Button>
          </div>
          <SearchField aria-label="Search amenities" value={amenitySearch} onChange={setAmenitySearch} className="create-listing-amenities-search w-full sm:max-w-xs">
            <SearchField.Group>
              <SearchField.SearchIcon><IconSearch /></SearchField.SearchIcon>
              <SearchField.Input
                placeholder="Search amenities..."
                className="bg-transparent text-foreground placeholder:text-muted-foreground"
              />
              <SearchField.ClearButton aria-label="Clear amenities search" />
            </SearchField.Group>
          </SearchField>
        </div>

        <section aria-label="Selected amenities" className="create-listing-selected-amenities mb-4 rounded-2xl border border-border bg-card p-4">
          <p className="font-nunito text-sm font-semibold text-foreground mb-3" aria-live="polite">
            Selected amenities ({formData.amenities.length})
          </p>
          {formData.amenities.length > 0 ? (
            <TagGroup
              aria-label="Remove selected amenities"
              onRemove={(keys) => {
                const removed = new Set(Array.from(keys, String));
                updateForm({ amenities: formData.amenities.filter((id) => !removed.has(id)) });
              }}
            >
              <TagGroup.List className="flex flex-wrap gap-2">
                {formData.amenities.map((id) => {
                  const Icon = PERKS[id]?.icon;
                  return (
                    <Tag key={id} id={id} textValue={nameOf(id)}>
                      {Icon && <Icon size={16} aria-hidden="true" className="text-primary" />}
                      {nameOf(id)}
                    </Tag>
                  );
                })}
              </TagGroup.List>
            </TagGroup>
          ) : (
            <p className="text-sm text-muted-foreground">No amenities selected yet.</p>
          )}
        </section>

        <p className="font-nunito text-sm font-semibold text-foreground mb-2">Available amenities</p>

        <div
          className={`grid grid-cols-2 gap-2.5 p-3 rounded-2xl border-2 transition ${
            errors.amenities ? "border-danger bg-danger/5" : "border-transparent"
          }`}
        >
          {visiblePerks.length === 0 ? (
            <p className="col-span-2 text-center text-sm text-muted-foreground py-4">
              {amenitySearch.trim()
                ? <>No available amenities match &ldquo;{amenitySearch.trim()}&rdquo;.</>
                : "No more amenities available."}
            </p>
          ) : (
            visiblePerks.map((perk) => {
              const Icon = perk.icon;
              return (
              <button
                key={perk.id}
                type="button"
                onClick={() => toggleAmenity(perk.id)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all cursor-pointer text-left border-border bg-card hover:border-primary/50 text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              >
                <Icon
                  size={18}
                  className="shrink-0 text-primary"
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
      <Modal>
        <Modal.Backdrop isOpen={isRulesOpen} onOpenChange={setIsRulesOpen}>
          <Modal.Container size="sm">
            <Modal.Dialog className="create-listing-flow">
              {({ close }) => (
                <>
                  <Modal.Header>
                    <Modal.Heading>Perks that can&apos;t go together</Modal.Heading>
                    <p className="text-sm text-muted-foreground">Picking one of these removes the others.</p>
                  </Modal.Header>
                  <Modal.Body className="space-y-3">
                    {AMENITY_RULES.map((rule) => (
                      <p key={rule.id} className="text-sm text-foreground">
                        <strong className="font-nunito font-semibold">{rule.name}</strong>
                        {" can't be combined with "}{rule.blocks}.
                      </p>
                    ))}
                  </Modal.Body>
                  <Modal.Footer>
                    <Button autoFocus onPress={close}>Got it</Button>
                  </Modal.Footer>
                </>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
