"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import {
  Button,
  Chip,
  Dropdown,
  Input,
  Label,
  ListBox,
  Select,
  TextArea,
  TextField,
  Modal,
  Drawer,
  useOverlayState,
  Separator,
} from "@heroui/react";

import {
  MoreHorizontal,
  Pencil,
  Trash2,
  FileText,
} from "lucide-react";

import { createBrowserClient } from "@repo/supabase";
import ApartmentImagesModal from "./modals/ApartmentImagesModal";
import LeaseAgreementModal from "./modals/LeaseAgreementModal";

import { PERKS } from "../../../components/inputs/perks";
import AmenitiesSelect from "../../../components/inputs/AmenitiesSelect";

import {
  APARTMENT_TYPES,
  FURNISHED_TYPES,
  FLOOR_LEVELS,
  LEASE_DURATIONS,
} from "@repo/constants";

import { CITIES, STATUS_COLOR } from "./propertyConstants";
import type { Property } from "./propertyTypes";
import AmenitiesModal from "./modals/AmenitiesModal";
import DescriptionModal from "./modals/DescriptionModal";
import EditPropertyModal from "./modals/EditPropertyModal";

type ApartmentImage = {
  id: string;
  url: string;
  is_cover: boolean;
};

type Props = {
  selected: Property | null;
  openEditMode: boolean;
  onClose: () => void;
  onUpdate: (property: Property) => void;
  onDelete: (id: string) => void;
};

const formatPeso = (value?: number | null) =>
  value == null ? "—" : `₱${value.toLocaleString()}`;

const buildAddress = (property: Property) => {
  const parts = [
    property.street_address,
    property.barangay,
    property.city,
    property.province,
    property.zip_code ? String(property.zip_code) : null,
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "—";
};

function ReadOnlyField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-grey-500">
        {label}
      </p>
      <p className="text-sm font-medium text-black">
        {value ?? "—"}
      </p>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="text-xs font-medium text-primary uppercase">
      {children}
    </p>
  );
}

export default function PropertyDetailsSheet({
  selected,
  openEditMode,
  onClose,
  onUpdate,
  onDelete,
}: Props) {
  const [form, setForm] = useState<Partial<Property>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [imagesModalOpen, setImagesModalOpen] = useState(false);
  const [apartmentImages, setApartmentImages] = useState<ApartmentImage[]>([]);

  const [leaseModalOpen, setLeaseModalOpen] = useState(false);
  const [viewingLease, setViewingLease] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [amenitiesModalOpen, setAmenitiesModalOpen] = useState(false);

  const lastSelectedId = useRef<string | null>(null);

  const drawerState = useOverlayState({
    isOpen: !!selected,
    onOpenChange: (open) => {
      if (!open) onClose();
    },
  });

  useEffect(() => {
    if (!selected) {
      setForm({});
      setEditModalOpen(false);
      setDescriptionModalOpen(false);
      setAmenitiesModalOpen(false);
      setLeaseModalOpen(false);
      setImagesModalOpen(false);
      lastSelectedId.current = null;
      return;
    }

    setForm({ ...selected });

    const isNewSelection = lastSelectedId.current !== selected.id;
    if (isNewSelection) {
      setEditModalOpen(openEditMode);
      setDescriptionModalOpen(false);
      setAmenitiesModalOpen(false);
      setLeaseModalOpen(false);
      setImagesModalOpen(false);
      lastSelectedId.current = selected.id;
      return;
    }

    if (openEditMode) {
      setEditModalOpen(true);
    }
  }, [selected, openEditMode]);

  const updateForm = <K extends keyof Property>(key: K, value: Property[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!selected) return;
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
      .eq("id", selected.id);

    if (!error) {
      const updated = { ...selected, ...form } as Property;
      onUpdate(updated);
      setForm(updated);
      setEditModalOpen(false);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selected || deleting) return;
    setDeleting(true);
    const supabase = createBrowserClient();

    const { error } = await supabase
      .from("apartments")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", selected.id);

    if (!error) {
      onDelete(selected.id);
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
  };

  const handleViewLease = async () => {
    if (!selected?.lease_agreement_url) return;
    setViewingLease(true);
    try {
      const supabase = createBrowserClient();
      const { data: signed, error } = await supabase.storage
        .from("lease-agreements")
        .createSignedUrl(selected.lease_agreement_url, 60 * 60);

      if (error) throw error;

      if (signed?.signedUrl) {
        const isPdf = selected.lease_agreement_url.toLowerCase().endsWith(".pdf");

        const leaseUrl = isPdf
          ? signed.signedUrl
          : `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(
              signed.signedUrl
            )}`;

        window.open(leaseUrl, "_blank");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to view lease agreement");
    } finally {
      setViewingLease(false);
    }
  };

  const handleEditModalOpenChange = (open: boolean) => {
    if (!open && selected) {
      setForm({ ...selected });
    }
    setEditModalOpen(open);
  };

  const isAnyModalOpen =
    imagesModalOpen ||
    leaseModalOpen ||
    editModalOpen ||
    descriptionModalOpen ||
    amenitiesModalOpen;

  const amenities = (selected?.amenities ?? [])
    .map((id) => ({ id, perk: PERKS[id] }))
    .filter((item) => item.perk);
  const previewAmenities = amenities.slice(0, 10);
  const totalMoveIn =
    (selected?.monthly_rent ?? 0) +
    (selected?.security_deposit ?? 0) +
    (selected?.advance_rent ?? 0);

  return (
    <>
      <Drawer.Root state={drawerState}>
        <Drawer.Trigger className="hidden" />
        <Drawer.Backdrop isDismissable={!isAnyModalOpen} className="z-50">
          <Drawer.Content placement="right" className="z-60">
            <Drawer.Dialog className="flex h-full flex-col p-0 w-[500px] max-w-[90vw]">
              <Drawer.Body className="flex-1 overflow-y-auto p-0">
                {selected && (
                  <div className="flex flex-col">
                    <div className="w-full h-56 relative shrink-0">
                      <Image
                        src={selected.thumbnail}
                        alt={selected.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-white font-semibold text-lg leading-tight truncate">
                            {selected.name}
                          </p>
                          <p className="text-white/80 text-sm flex items-center gap-1">
                            {buildAddress(selected)} 
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

                    <div className="px-4 py-4 flex items-center justify-between">
                      <h3 className="text-base font-medium text-black">
                        Property Details
                      </h3>

                      <div className="flex flex-row gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onPress={() => handleEditImages(selected.id)}
                        >
                          Edit Images
                        </Button>

                        <Dropdown>
                          <Button 
                            isIconOnly 
                            variant="ghost" 
                            size="sm"
                            className="rounded-full"
                          >
                            <MoreHorizontal 
                              size={16} 
                              className="text-black"
                            />
                          </Button>

                          <Dropdown.Popover>
                            <Dropdown.Menu
                              onAction={(key) => {
                                if (key === "edit") setEditModalOpen(true);
                                if (key === "view-lease") handleViewLease();
                                if (key === "edit-lease") setLeaseModalOpen(true);
                                if (key === "upload-lease") setLeaseModalOpen(true);
                                if (key === "delete") handleDelete();
                              }}
                            >
                              <Dropdown.Item id="edit" textValue="Edit">
                                <div className="flex items-center gap-2">
                                  <Pencil size={14} />
                                  <span>Edit</span>
                                </div>
                              </Dropdown.Item>

                              {selected.lease_agreement_url ? (
                                <>
                                  <Dropdown.Item
                                    id="view-lease"
                                    textValue="View Lease"
                                    isDisabled={viewingLease}
                                  >
                                    <div className="flex items-center gap-2">
                                      <FileText size={14} />
                                      <span>View Lease</span>
                                    </div>
                                  </Dropdown.Item>
                                  <Dropdown.Item id="edit-lease" textValue="Edit Lease">
                                    <div className="flex items-center gap-2">
                                      <Pencil size={14} />
                                      <span>Edit Lease</span>
                                    </div>
                                  </Dropdown.Item>
                                </>
                              ) : (
                                <Dropdown.Item id="upload-lease" textValue="Upload Lease">
                                  <div className="flex items-center gap-2">
                                    <FileText size={14} />
                                    <span>Upload Lease</span>
                                  </div>
                                </Dropdown.Item>
                              )}

                              <Dropdown.Item
                                id="delete"
                                textValue="Delete"
                                variant="danger"
                                className="text-danger"
                                isDisabled={deleting}
                              >
                                <div className="flex items-center gap-2">
                                  <Trash2 size={14} />
                                  <span>Delete</span>
                                </div>
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown.Popover>
                        </Dropdown>
                      </div>
                    </div>

                    <div className="px-4 pb-6 flex flex-col gap-6">
                      <section>
                        <SectionTitle>
                          Price Details
                        </SectionTitle>
                        
                        <div className="grid grid-cols-2 gap-3 mt-1">
                          <div className="col-span-2 rounded-lg border border-default-200 bg-default-50 p-3 flex items-center justify-between">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              Total Move-in
                            </p>
                            <p className="text-sm font-semibold text-primary">
                              ₱{totalMoveIn.toLocaleString()}
                            </p>
                          </div>

                          <ReadOnlyField
                            label="Monthly Rent"
                            value={formatPeso(selected.monthly_rent)}
                          />
                          <ReadOnlyField
                            label="Security Deposit"
                            value={formatPeso(selected.security_deposit)}
                          />
                          <ReadOnlyField
                            label="Advance Rent"
                            value={formatPeso(selected.advance_rent)}
                          />
                        </div>
                      </section>

                      <Separator />

                      <section>
                        <SectionTitle>
                          Unit Details
                        </SectionTitle>
                              
                        <div className="grid grid-cols-2 gap-3">
                          <ReadOnlyField
                            label="Bedrooms"
                            value={selected.no_bedrooms ?? "—"}
                          />
                          <ReadOnlyField
                            label="Bathrooms"
                            value={selected.no_bathrooms ?? "—"}
                          />
                          <ReadOnlyField label="Area (sqm)" value={selected.area_sqm} />
                          <ReadOnlyField label="Max Occupants" value={selected.max_occupants} />
                          <ReadOnlyField label="Type" value={selected.type} />
                          <ReadOnlyField label="Furnishing" value={selected.furnished_type} />
                          <ReadOnlyField label="Floor Level" value={selected.floor_level} />
                          <ReadOnlyField label="Lease Duration" value={selected.lease_duration} />
                        </div>
                      </section>

                      <Separator />

                      <section>
                        <div className="flex items-center justify-between mb-2">
                          <SectionTitle>
                            Description
                          </SectionTitle>

                          {selected.description && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onPress={() => setDescriptionModalOpen(true)}
                              className="text-secondary"
                            >
                              View all
                            </Button>
                          )}
                        </div>
                        <p className="text-sm text-black leading-relaxed line-clamp-10 whitespace-pre-line">
                          {selected.description ?? "—"}
                        </p>
                      </section>

                      <Separator />

                      <section>
                        <div className="flex items-center justify-between mb-2">
                          <SectionTitle>
                            Amenities
                          </SectionTitle>
                          
                          {amenities.length > 0 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-secondary"
                              onPress={() => setAmenitiesModalOpen(true)}
                            >
                              View all
                            </Button>
                          )}
                        </div>
                        {amenities.length === 0 ? (
                          <p className="text-sm text-default-700">—</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {previewAmenities.map((item) => (
                              <Chip 
                                key={item.id} 
                                size="sm" 
                                variant="soft"
                                className="flex flex-row gap-1 px-2 py-1"
                              >
                                {item.perk.icon && (
                                  <item.perk.icon 
                                    size={14}
                                  />
                                )}

                                {item.perk?.name}
                              </Chip>
                            ))}
                          </div>
                        )}
                      </section>

                    </div>
                  </div>
                )}
              </Drawer.Body>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer.Root>

      {selected && (
        <ApartmentImagesModal
          isOpen={imagesModalOpen}
          onClose={() => setImagesModalOpen(false)}
          apartmentId={selected.id}
          images={apartmentImages}
          onImagesChange={(images) => {
            setApartmentImages(images);
            const newCover = images.find((image) => image.is_cover)?.url;
            if (newCover) {
              onUpdate({ ...selected, thumbnail: newCover });
            }
          }}
        />
      )}

      {selected && (
        <LeaseAgreementModal
          isOpen={leaseModalOpen}
          onClose={() => setLeaseModalOpen(false)}
          apartmentId={selected.id}
          currentUrl={selected.lease_agreement_url}
          onUpdated={(newUrl) => {
            onUpdate({ ...selected, lease_agreement_url: newUrl });
          }}
        />
      )}

      <DescriptionModal
        isOpen={descriptionModalOpen}
        onClose={() => setDescriptionModalOpen(false)}
        description={selected?.description}
      />

      <AmenitiesModal
        isOpen={amenitiesModalOpen}
        onClose={() => setAmenitiesModalOpen(false)}
        amenityIds={selected?.amenities}
      />

      {selected && (
        <EditPropertyModal
          isOpen={editModalOpen}
          property={selected}
          onClose={() => setEditModalOpen(false)}
          onSaved={(updated) => {
            onUpdate(updated);
            setEditModalOpen(false);
          }}
        />
      )}
    </>
  );
}
