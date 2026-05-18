import { useState } from "react";
import {
  Button, Input, Label, ListBox, Modal, Select,
  TextArea, TextField,
} from "@heroui/react";
import { createBrowserClient } from "@repo/supabase";
import AmenitiesSelect from "../../../../components/inputs/AmenitiesSelect";
import { PERKS } from "../../../../components/inputs/perks";
import {
  APARTMENT_TYPES, FURNISHED_TYPES,
  FLOOR_LEVELS, LEASE_DURATIONS,
} from "@repo/constants";
import { CITIES } from "../propertyConstants";
import type { Property } from "../propertyTypes";

function SectionTitle({ children }: { children: string }) {
  return <p className="text-xs font-medium text-primary uppercase">{children}</p>;
}

type Props = {
  isOpen: boolean;
  property: Property;
  onClose: () => void;
  onSaved: (updated: Property) => void;
};

export default function EditPropertyModal({ isOpen, property, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Partial<Property>>({ ...property });
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens with a (possibly different) property
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setForm({ ...property });
      onClose();
    }
  };

  const updateForm = <K extends keyof Property>(key: K, value: Property[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = createBrowserClient();

    const { error } = await supabase
      .from("apartments")
      .update({
        name: form.name ?? undefined,
        description: form.description ?? undefined,
        monthly_rent: form.monthly_rent,
        security_deposit: form.security_deposit ?? undefined,
        advance_rent: form.advance_rent ?? undefined,
        type: form.type ?? undefined,
        street_address: form.street_address ?? undefined,
        barangay: form.barangay ?? undefined,
        city: form.city ?? undefined,
        province: form.province ?? undefined,
        zip_code: form.zip_code ?? undefined,
        no_bedrooms: form.no_bedrooms ?? undefined,
        no_bathrooms: form.no_bathrooms ?? undefined,
        area_sqm: form.area_sqm ?? undefined,
        max_occupants: form.max_occupants ?? undefined,
        furnished_type: form.furnished_type ?? undefined,
        floor_level: form.floor_level ?? undefined,
        lease_duration: form.lease_duration ?? undefined,
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
        amenities: form.amenities ?? undefined,
      })
      .eq("id", property.id);

    if (!error) {
      const updated = { ...property, ...form } as Property;
      onSaved(updated);
    }
    setSaving(false);
  };

  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={handleOpenChange}>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog>
            {({ close }) => (
              <>
                <Modal.Header>
                  <Modal.Heading>Edit Property</Modal.Heading>
                </Modal.Header>
                <Modal.Body className="flex flex-col gap-5">
                  {/* Basic Info */}
                  <section>
                    <SectionTitle>Basic Info</SectionTitle>
                    <div className="flex flex-col gap-4">
                      <TextField>
                        <Label>Name</Label>
                        <Input
                          placeholder="Apartment name"
                          value={form.name ?? ""}
                          onChange={(e) => updateForm("name", e.target.value)}
                        />
                      </TextField>
                      <TextField>
                        <Label>Description</Label>
                        <TextArea
                          placeholder="Describe the unit..."
                          value={form.description ?? ""}
                          onChange={(e) => updateForm("description", e.target.value)}
                          rows={4}
                        />
                      </TextField>
                    </div>
                  </section>

                  {/* Price Details */}
                  <section>
                    <SectionTitle>Price Details</SectionTitle>
                    <div className="grid grid-cols-2 gap-3">
                      <TextField>
                        <Label>Monthly Rent (₱)</Label>
                        <Input
                          type="number"
                          value={String(form.monthly_rent ?? "")}
                          onChange={(e) => updateForm("monthly_rent", Number(e.target.value))}
                        />
                      </TextField>
                      <TextField>
                        <Label>Security Deposit (₱)</Label>
                        <Input
                          type="number"
                          value={String(form.security_deposit ?? "")}
                          onChange={(e) => updateForm("security_deposit", Number(e.target.value))}
                        />
                      </TextField>
                      <TextField>
                        <Label>Advance Rent (₱)</Label>
                        <Input
                          type="number"
                          value={String(form.advance_rent ?? "")}
                          onChange={(e) => updateForm("advance_rent", Number(e.target.value))}
                        />
                      </TextField>
                    </div>
                  </section>

                  {/* Unit Details */}
                  <section>
                    <SectionTitle>Unit Details</SectionTitle>
                    <div className="grid grid-cols-2 gap-3">
                      <Select value={form.type ?? null} onChange={(v) => updateForm("type", (v as string) ?? null)} placeholder="Select one">
                        <Label>Type</Label>
                        <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                        <Select.Popover><ListBox>{APARTMENT_TYPES.map((t) => <ListBox.Item key={t} id={t}>{t}</ListBox.Item>)}</ListBox></Select.Popover>
                      </Select>
                      <Select value={form.furnished_type ?? null} onChange={(v) => updateForm("furnished_type", (v as string) ?? null)} placeholder="Select one">
                        <Label>Furnishing</Label>
                        <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                        <Select.Popover><ListBox>{FURNISHED_TYPES.map((t) => <ListBox.Item key={t} id={t}>{t}</ListBox.Item>)}</ListBox></Select.Popover>
                      </Select>
                      <Select value={form.floor_level ?? null} onChange={(v) => updateForm("floor_level", (v as string) ?? null)} placeholder="Select one">
                        <Label>Floor Level</Label>
                        <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                        <Select.Popover><ListBox>{FLOOR_LEVELS.map((l) => <ListBox.Item key={l} id={l}>{l}</ListBox.Item>)}</ListBox></Select.Popover>
                      </Select>
                      <Select value={form.lease_duration ?? null} onChange={(v) => updateForm("lease_duration", (v as string) ?? null)} placeholder="Select one">
                        <Label>Lease Duration</Label>
                        <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                        <Select.Popover><ListBox>{LEASE_DURATIONS.map((d) => <ListBox.Item key={d} id={d}>{d}</ListBox.Item>)}</ListBox></Select.Popover>
                      </Select>
                      <TextField>
                        <Label>Bedrooms</Label>
                        <Input type="number" value={String(form.no_bedrooms ?? "")} onChange={(e) => updateForm("no_bedrooms", Number(e.target.value))} />
                      </TextField>
                      <TextField>
                        <Label>Bathrooms</Label>
                        <Input type="number" value={String(form.no_bathrooms ?? "")} onChange={(e) => updateForm("no_bathrooms", Number(e.target.value))} />
                      </TextField>
                      <TextField>
                        <Label>Area (sqm)</Label>
                        <Input type="number" value={String(form.area_sqm ?? "")} onChange={(e) => updateForm("area_sqm", Number(e.target.value))} />
                      </TextField>
                      <TextField>
                        <Label>Max Occupants</Label>
                        <Input type="number" value={String(form.max_occupants ?? "")} onChange={(e) => updateForm("max_occupants", Number(e.target.value))} />
                      </TextField>
                    </div>
                  </section>

                  {/* Address */}
                  <section>
                    <SectionTitle>Address</SectionTitle>
                    <TextField>
                      <Label>Street Address</Label>
                      <Input value={form.street_address ?? ""} onChange={(e) => updateForm("street_address", e.target.value)} />
                    </TextField>
                    <div className="grid grid-cols-2 gap-3">
                      <TextField>
                        <Label>Barangay</Label>
                        <Input value={form.barangay ?? ""} onChange={(e) => updateForm("barangay", e.target.value)} />
                      </TextField>
                      <Select value={form.city ?? null} onChange={(v) => updateForm("city", (v as string) ?? null)} placeholder="Select one">
                        <Label>City</Label>
                        <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
                        <Select.Popover><ListBox>{CITIES.map((c) => <ListBox.Item key={c} id={c}>{c}</ListBox.Item>)}</ListBox></Select.Popover>
                      </Select>
                      <TextField>
                        <Label>Province</Label>
                        <Input value={form.province ?? ""} onChange={(e) => updateForm("province", e.target.value)} />
                      </TextField>
                      <TextField>
                        <Label>Zip Code</Label>
                        <Input type="number" value={String(form.zip_code ?? "")} onChange={(e) => updateForm("zip_code", Number(e.target.value))} />
                      </TextField>
                    </div>
                  </section>

                  {/* Coordinates */}
                  <section>
                    <SectionTitle>Coordinates</SectionTitle>
                    <div className="grid grid-cols-2 gap-3">
                      <TextField>
                        <Label>Latitude</Label>
                        <Input type="number" value={String(form.latitude ?? "")} onChange={(e) => updateForm("latitude", Number(e.target.value))} />
                      </TextField>
                      <TextField>
                        <Label>Longitude</Label>
                        <Input type="number" value={String(form.longitude ?? "")} onChange={(e) => updateForm("longitude", Number(e.target.value))} />
                      </TextField>
                    </div>
                  </section>

                  {/* Amenities */}
                  <section>
                    <SectionTitle>Amenities</SectionTitle>
                    <AmenitiesSelect
                      amenities={Object.values(PERKS)}
                      selected={form.amenities ?? []}
                      onChange={(val: string[]) => updateForm("amenities", val)}
                    />
                  </section>
                </Modal.Body>
                <Modal.Footer>
                  <Button variant="tertiary" onPress={() => { close(); setForm({ ...property }); }}>
                    Cancel
                  </Button>
                  <Button isPending={saving} onPress={handleSave}>
                    Save Changes
                  </Button>
                </Modal.Footer>
                <Modal.CloseTrigger />
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}