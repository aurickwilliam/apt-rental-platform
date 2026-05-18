"use client";

import { useState } from "react";
import Image from "next/image";

import {
  Button,
  Chip,
  Input,
  Label,
  ListBox,
  Select,
  TextArea,
  TextField,
} from "@heroui/react";

import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader,
  SheetTitle, SheetFooter,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Star, MoreHorizontal, Pencil, Trash2,
  MapPin, BedDouble, Bath, Expand, Users,
  FileText
} from "lucide-react";

import { createBrowserClient } from "@repo/supabase";
import ApartmentImagesModal from "./ApartmentImagesModal";
import LeaseAgreementModal from "./LeaseAgreementModal";

import { PERKS } from "../../../components/inputs/perks";
import AmenitiesSelect from "@/app/components/inputs/AmenitiesSelect";

import { 
  APARTMENT_TYPES, 
  FURNISHED_TYPES, 
  FLOOR_LEVELS, 
  LEASE_DURATIONS 
} from "@repo/constants";

const CITIES = ["Caloocan", "Malabon", "Navotas", "Valenzuela"];

const STATUS_COLOR: Record<string, "success" | "warning" | "default"> = {
  verified:   "success",
  unverified: "warning",
  occupied:   "default",
};


// Property Types/Interfaces
export type Property = {
  id:             string;
  name:           string;
  description:    string | null;
  monthly_rent:   number;
  type:           string | null;
  street_address: string | null;
  barangay:       string | null;
  city:           string | null;
  province:       string | null;
  zip_code:       number | null;
  status:         string;
  average_rating: number;
  no_ratings:     number;
  no_bedrooms:    number | null;
  no_bathrooms:   number | null;
  area_sqm:       number | null;
  max_occupants:  number | null;
  furnished_type: string | null;
  floor_level:    string | null;
  lease_duration: string | null;
  latitude:       number | null;
  longitude:      number | null;
  amenities:      string[];
  thumbnail:      string;
  lease_agreement_url?: string | null;
};

type Props = {
  properties: Property[];
};


// Helper Components
function ReadOnlyField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
      {children}
    </p>
  );
}

type ApartmentImage = {
  id:       string;
  url:      string;
  is_cover: boolean;
};


export default function PropertiesTable({ properties: initial }: Props) {
  const [properties, setProperties] = useState<Property[]>(initial);
  const [selected, setSelected]     = useState<Property | null>(null);
  const [form, setForm]             = useState<Partial<Property>>({});
  const [isEditing, setIsEditing]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);

  // For Modal in Editing Images
  const [imagesModalOpen, setImagesModalOpen] = useState(false);
  const [apartmentImages, setApartmentImages] = useState<ApartmentImage[]>([]);

  // For Modal in Editing Lease Agreement
  const [leaseModalOpen, setLeaseModalOpen] = useState(false);
  const [viewingLease, setViewingLease] = useState(false);

  
  // Sheet Handlers
  const openSheet = (property: Property, editMode = false) => {
    setSelected(property);
    setForm({ ...property });
    setIsEditing(editMode);
  };

  const closeSheet = () => {
    setSelected(null);
    setForm({});
    setIsEditing(false);
  };

  const updateForm = <K extends keyof Property>(key: K, value: Property[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };


  // Supabase Handlers
  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const supabase = createBrowserClient();

    const { error } = await supabase
      .from("apartments")
      .update({
        name:           form.name ?? undefined,
        description:    form.description ?? undefined,
        monthly_rent:   form.monthly_rent,
        type:           form.type ?? undefined,
        street_address: form.street_address ?? undefined,
        barangay:       form.barangay ?? undefined,
        city:           form.city ?? undefined,
        province:       form.province ?? undefined,
        zip_code:       form.zip_code ?? undefined,
        no_bedrooms:    form.no_bedrooms ?? undefined,
        no_bathrooms:   form.no_bathrooms ?? undefined,
        area_sqm:       form.area_sqm ?? undefined,
        max_occupants:  form.max_occupants ?? undefined,
        furnished_type: form.furnished_type ?? undefined,
        floor_level:    form.floor_level ?? undefined,
        lease_duration: form.lease_duration ?? undefined,
        latitude:       form.latitude ?? undefined,
        longitude:      form.longitude ?? undefined,
        amenities:      form.amenities ?? undefined,
      })
      .eq("id", selected.id);

    if (!error) {
      const updated = { ...selected, ...form } as Property;
      setProperties((prev) => prev.map((p) => (p.id === selected.id ? updated : p)));
      setSelected(updated);
      setIsEditing(false);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    const supabase = createBrowserClient();

    const { error } = await supabase
      .from("apartments")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", selected.id);

    if (!error) {
      setProperties((prev) => prev.filter((p) => p.id !== selected.id));
      closeSheet();
    }
    setDeleting(false);
  };

  const handleEditImages = async (selectedId: string) => {
    const supabase = createBrowserClient();
    const { data } = await supabase
      .from("apartment_images")
      .select("id, url, is_cover")
      .eq("apartment_id", selectedId);

    setApartmentImages(
      (data ?? []).map((img) => ({
        ...img,
        is_cover: img.is_cover ?? false,
      }))
    );
    setImagesModalOpen(true);
  }

  const handleViewLease = async () => {
    if (!selected?.lease_agreement_url) return;
    setViewingLease(true);
    try {
      const supabase = createBrowserClient();
      const { data: signed, error } = await supabase.storage
        .from('lease-agreements')
        .createSignedUrl(selected.lease_agreement_url, 60 * 60);

      if (error) throw error;

      if (signed?.signedUrl) {
        const isPdf = selected.lease_agreement_url.toLowerCase().endsWith('.pdf');
        
        const leaseUrl = isPdf
          ? signed.signedUrl 
          : `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(signed.signedUrl)}`;
        
        window.open(leaseUrl, '_blank');
      }
    } catch (err) {
      console.error(err);
      alert("Failed to view lease agreement");
    } finally {
      setViewingLease(false);
    }
  };

  
  // Empty State of the Table
  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
        <p className="text-base font-medium">No properties yet</p>
        <p className="text-sm">Add your first listing to get started</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Photo</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {properties.map((property) => (
            <TableRow
              key={property.id}
              className="cursor-pointer hover:bg-default-50"
              onClick={() => openSheet(property)}
            >
              <TableCell>
                <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                  <Image src={property.thumbnail} alt={property.name} fill className="object-cover" />
                </div>
              </TableCell>

              <TableCell>
                <p className="font-medium text-sm truncate max-w-40">{property.name}</p>
                <p className="text-xs text-muted-foreground">
                  {property.no_bedrooms ?? "—"} bed · {property.no_bathrooms ?? "—"} bath
                </p>
              </TableCell>

              <TableCell>
                <p className="text-sm">{property.barangay}</p>
                <p className="text-xs text-muted-foreground">{property.city}</p>
              </TableCell>

              <TableCell>
                <p className="text-sm">{property.type ?? "—"}</p>
              </TableCell>

              <TableCell>
                <p className="text-sm font-medium text-primary">₱{property.monthly_rent?.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">/month</p>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-yellow-400" fill="currentColor" />
                  <span className="text-sm">{property.average_rating > 0 ? property.average_rating : "—"}</span>
                </div>
              </TableCell>

              <TableCell>
                <Chip
                  size="sm" 
                  variant="soft"
                  color={STATUS_COLOR[property.status] ?? "default"}
                  className="capitalize"
                >
                  {property.status}
                </Chip>
              </TableCell>

              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      isIconOnly 
                      variant="tertiary" 
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="gap-2 cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); openSheet(property, true); }}
                    >
                      <Pencil size={14} /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 cursor-pointer text-danger focus:text-danger"
                      onClick={(e) => { e.stopPropagation(); openSheet(property); }}
                    >
                      <Trash2 size={14} /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      
      {/* Side Sheet for Apartment Information */}
      <Sheet
        open={!!selected}
        onOpenChange={(open) => !open && closeSheet()}
      >
        <SheetContent
          style={{ width: "600px", maxWidth: "none" }}
          className="overflow-y-auto flex flex-col gap-0 p-0 z-50"
          onPointerDownOutside={(e) => {
            if (imagesModalOpen || leaseModalOpen) {
              e.preventDefault();
            }
          }}
        >
          {selected && (
            <>
              {/* Cover Image */}
              <div className="w-full h-52 relative shrink-0">
                <Image src={selected.thumbnail} alt={selected.name} fill className="object-cover" />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                  <div>
                    <p className="text-white font-semibold text-lg leading-tight">{selected.name}</p>
                    <p className="text-white/80 text-sm flex items-center gap-1">
                      <MapPin size={12} /> {selected.barangay}, {selected.city}
                    </p>
                  </div>
                  <Chip
                    size="sm" 
                    variant="primary"
                    color={STATUS_COLOR[selected.status] ?? "default"}
                    className="capitalize"
                  >
                    {selected.status}
                  </Chip>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col gap-5 flex-1">
                {/* Header */}
                <SheetHeader className="p-0">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="font-noto-serif text-lg">
                      {isEditing ? "Edit Property" : "Property Details"}
                    </SheetTitle>
                    <Button
                      size="sm"
                      variant={isEditing ? "tertiary" : "outline"}
                      onPress={() => setIsEditing((prev) => !prev)}
                    >
                      {isEditing ? "Cancel" : "Edit"}
                    </Button>
                  </div>
                </SheetHeader>

                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { icon: BedDouble, label: `${selected.no_bedrooms ?? "—"} Beds`      },
                    { icon: Bath,      label: `${selected.no_bathrooms ?? "—"} Baths`     },
                    { icon: Expand,    label: `${selected.area_sqm ?? "—"} sqm`           },
                    { icon: Users,     label: `${selected.max_occupants ?? "—"} max`      },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1 bg-default-50 rounded-lg p-2">
                      <Icon size={16} className="text-primary" />
                      <p className="text-xs text-center font-medium">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-yellow-400" fill="currentColor" />
                  <span className="text-sm font-medium">
                    {selected.average_rating > 0 ? selected.average_rating : "No ratings"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({selected.no_ratings} {selected.no_ratings === 1 ? "review" : "reviews"})
                  </span>
                </div>

                {/* ── Read-only view ── */}
                {!isEditing ? (
                  <div className="flex flex-col gap-5">
                    <section>
                      <SectionTitle>Pricing</SectionTitle>
                      <ReadOnlyField label="Monthly Rent" value={`₱${selected.monthly_rent?.toLocaleString()}`} />
                    </section>

                    <section>
                      <SectionTitle>Unit Details</SectionTitle>
                      <div className="grid grid-cols-2 gap-3">
                        <ReadOnlyField label="Type"           value={selected.type}           />
                        <ReadOnlyField label="Furnishing"     value={selected.furnished_type} />
                        <ReadOnlyField label="Floor Level"    value={selected.floor_level}    />
                        <ReadOnlyField label="Lease Duration" value={selected.lease_duration} />
                      </div>
                    </section>

                    <section>
                      <SectionTitle>Address</SectionTitle>
                      <div className="grid grid-cols-2 gap-3">
                        <ReadOnlyField label="Street"   value={selected.street_address} />
                        <ReadOnlyField label="Barangay" value={selected.barangay}       />
                        <ReadOnlyField label="City"     value={selected.city}           />
                        <ReadOnlyField label="Province" value={selected.province}       />
                        <ReadOnlyField label="Zip Code" value={selected.zip_code}       />
                      </div>
                    </section>

                    <section>
                      <SectionTitle>Coordinates</SectionTitle>
                      <div className="grid grid-cols-2 gap-3">
                        <ReadOnlyField label="Latitude"  value={selected.latitude}  />
                        <ReadOnlyField label="Longitude" value={selected.longitude} />
                      </div>
                    </section>

                    <section>
                      <SectionTitle>Description</SectionTitle>
                      <p className="text-sm text-default-700 leading-relaxed">
                        {selected.description ?? "—"}
                      </p>
                    </section>

                    {selected.amenities?.length > 0 && (
                      <section>
                        <SectionTitle>Amenities</SectionTitle>
                        <div className="flex flex-wrap gap-1.5">
                          {selected.amenities.map((id) => {
                            const perk = PERKS[id];
                            return perk ? (
                              <Chip key={id} 
                                size="sm" 
                                variant="tertiary"
                              >
                                {perk.name}
                              </Chip>
                            ) : null;
                          })}
                        </div>
                      </section>
                    )}

                    <section>
                      <SectionTitle>Lease Agreement</SectionTitle>
                      {selected.lease_agreement_url ? (
                        <div className="flex gap-2">
                          <Button 
                            className="flex-1" 
                            variant="tertiary" 
                            onPress={handleViewLease}
                            isPending={viewingLease}
                          >
                            <FileText size={16} /> View Document
                          </Button>
                          <Button 
                            isIconOnly 
                            variant="tertiary" 
                            onPress={() => setLeaseModalOpen(true)}
                          >
                            <Pencil size={16} />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center text-sm text-muted-foreground p-3 border border-dashed rounded-lg">
                          <p>No lease agreement uploaded</p>
                          <Button 
                            size="sm" 
                            variant="tertiary" 
                            onPress={() => setLeaseModalOpen(true)}
                          >
                            Upload
                          </Button>
                        </div>
                      )}
                    </section>

                    {/* Button to trigger Modal for Editing Images*/}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onPress={() => handleEditImages(selected.id)}
                    >
                      Edit Images
                    </Button>
                  </div>
                ) : (
                  // Edit Mode Form
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
                        rows={3}
                      />
                    </TextField>
                    <TextField>
                      <Label>Monthly Rent (₱)</Label>
                      <Input
                        type="number"
                        value={String(form.monthly_rent ?? "")}
                        onChange={(e) => updateForm("monthly_rent", Number(e.target.value))}
                      />
                    </TextField>

                    <div className="grid grid-cols-2 gap-3">
                      <Select
                        value={form.type ?? null}
                        onChange={(value) => updateForm("type", (value as string) ?? null)}
                        placeholder="Select one"
                      >
                        <Label>Type</Label>
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {APARTMENT_TYPES.map((t) => (
                              <ListBox.Item key={t} id={t}>
                                {t}
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                      <Select
                        value={form.furnished_type ?? null}
                        onChange={(value) => updateForm("furnished_type", (value as string) ?? null)}
                        placeholder="Select one"
                      >
                        <Label>Furnishing</Label>
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {FURNISHED_TYPES.map((t) => (
                              <ListBox.Item key={t} id={t}>
                                {t}
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                      <Select
                        value={form.floor_level ?? null}
                        onChange={(value) => updateForm("floor_level", (value as string) ?? null)}
                        placeholder="Select one"
                      >
                        <Label>Floor Level</Label>
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {FLOOR_LEVELS.map((t) => (
                              <ListBox.Item key={t} id={t}>
                                {t}
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                      <Select
                        value={form.lease_duration ?? null}
                        onChange={(value) => updateForm("lease_duration", (value as string) ?? null)}
                        placeholder="Select one"
                      >
                        <Label>Lease Duration</Label>
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {LEASE_DURATIONS.map((t) => (
                              <ListBox.Item key={t} id={t}>
                                {t}
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                      <TextField>
                        <Label>Bedrooms</Label>
                        <Input
                          type="number"
                          value={String(form.no_bedrooms ?? "")}
                          onChange={(e) => updateForm("no_bedrooms", Number(e.target.value))}
                        />
                      </TextField>
                      <TextField>
                        <Label>Bathrooms</Label>
                        <Input
                          type="number"
                          value={String(form.no_bathrooms ?? "")}
                          onChange={(e) => updateForm("no_bathrooms", Number(e.target.value))}
                        />
                      </TextField>
                      <TextField>
                        <Label>Area (sqm)</Label>
                        <Input
                          type="number"
                          value={String(form.area_sqm ?? "")}
                          onChange={(e) => updateForm("area_sqm", Number(e.target.value))}
                        />
                      </TextField>
                      <TextField>
                        <Label>Max Occupants</Label>
                        <Input
                          type="number"
                          value={String(form.max_occupants ?? "")}
                          onChange={(e) => updateForm("max_occupants", Number(e.target.value))}
                        />
                      </TextField>
                    </div>

                    <SectionTitle>Address</SectionTitle>
                    <TextField>
                      <Label>Street Address</Label>
                      <Input
                        value={form.street_address ?? ""}
                        onChange={(e) => updateForm("street_address", e.target.value)}
                      />
                    </TextField>
                    <div className="grid grid-cols-2 gap-3">
                      <TextField>
                        <Label>Barangay</Label>
                        <Input
                          value={form.barangay ?? ""}
                          onChange={(e) => updateForm("barangay", e.target.value)}
                        />
                      </TextField>
                      <Select
                        value={form.city ?? null}
                        onChange={(value) => updateForm("city", (value as string) ?? null)}
                        placeholder="Select one"
                      >
                        <Label>City</Label>
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {CITIES.map((c) => (
                              <ListBox.Item key={c} id={c}>
                                {c}
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                      <TextField>
                        <Label>Province</Label>
                        <Input
                          value={form.province ?? ""}
                          onChange={(e) => updateForm("province", e.target.value)}
                        />
                      </TextField>
                      <TextField>
                        <Label>Zip Code</Label>
                        <Input
                          type="number"
                          value={String(form.zip_code ?? "")}
                          onChange={(e) => updateForm("zip_code", Number(e.target.value))}
                        />
                      </TextField>
                    </div>

                    <SectionTitle>Coordinates</SectionTitle>
                    <div className="grid grid-cols-2 gap-3">
                      <TextField>
                        <Label>Latitude</Label>
                        <Input
                          type="number"
                          value={String(form.latitude ?? "")}
                          onChange={(e) => updateForm("latitude", Number(e.target.value))}
                        />
                      </TextField>
                      <TextField>
                        <Label>Longitude</Label>
                        <Input
                          type="number"
                          value={String(form.longitude ?? "")}
                          onChange={(e) => updateForm("longitude", Number(e.target.value))}
                        />
                      </TextField>
                    </div>

                    <SectionTitle>Amenities</SectionTitle>
                    <AmenitiesSelect
                      amenities={Object.values(PERKS)}
                      selected={form.amenities ?? []}
                      onChange={(val) => updateForm("amenities", val)}
                    />
                  </div>
                )}
              </div>

              {/* Footer */}
              <SheetFooter className="p-4 border-t flex flex-col gap-2">
                {isEditing ? (
                  <Button
                    className="w-full" 
                    isPending={saving} 
                    onPress={handleSave}
                  >
                    Save Changes
                  </Button>
                ) : (
                  <Button
                    variant="tertiary" 
                    className="w-full" 
                    isPending={deleting} 
                    onPress={handleDelete}
                  >
                    Delete Property
                  </Button>
                )}
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Modal for Editing Apartment Images */}
      {selected && (
        <ApartmentImagesModal
          isOpen={imagesModalOpen}
          onClose={() => setImagesModalOpen(false)}
          apartmentId={selected.id}
          images={apartmentImages}
          onImagesChange={(imgs) => {
            setApartmentImages(imgs);
            const newCover = imgs.find((img) => img.is_cover)?.url;
            if (newCover) {
              setProperties((prev) =>
                prev.map((p) => p.id === selected.id ? { ...p, thumbnail: newCover } : p)
              );
              setSelected((prev) => prev ? { ...prev, thumbnail: newCover } : prev);
            }
          }}
        />
      )}

      {/* Modal for Editing Lease Agreement */}
      {selected && (
        <LeaseAgreementModal
          isOpen={leaseModalOpen}
          onClose={() => setLeaseModalOpen(false)}
          apartmentId={selected.id}
          currentUrl={selected.lease_agreement_url}
          onUpdated={(newUrl) => {
            setProperties((prev) =>
              prev.map((p) => p.id === selected.id ? { ...p, lease_agreement_url: newUrl } : p)
            );
            setSelected((prev) => prev ? { ...prev, lease_agreement_url: newUrl } : prev);
          }}
        />
      )}
    </>
  );
}
