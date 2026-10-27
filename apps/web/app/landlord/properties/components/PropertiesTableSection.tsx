"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import PropertiesTable from "./PropertiesTable";
import RouteLoadingStatus from "@/app/components/display/RouteLoadingStatus";
import type { Property } from "./propertyTypes";
import { createClient as createBrowserClient } from "@repo/supabase/browser";
import DeletePropertyModal from "./modals/DeletePropertyModal";

const PropertyDetailsSheet = dynamic(() => import("./PropertyDetailsSheet"), {
  loading: () => <RouteLoadingStatus>Opening property details…</RouteLoadingStatus>,
});

type Props = {
  properties: Property[];
};

export default function PropertiesTableSection({ properties: initial }: Props) {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>(initial);
  const [selected, setSelected] = useState<Property | null>(null);
  const [openEditMode, setOpenEditMode] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openSheet = (property: Property, editMode = false) => {
    setSelected(property);
    setOpenEditMode(editMode);
  };

  const closeSheet = () => {
    setSelected(null);
    setOpenEditMode(false);
  };

  const handleUpdate = (updated: Property) => {
    setProperties((prev) =>
      prev.map((property) => (property.id === updated.id ? updated : property))
    );
    setSelected(updated);
  };

  const handleDelete = (id: string) => {
    setProperties((prev) => prev.filter((property) => property.id !== id));
    closeSheet();
  };

  const handleDeleteTarget = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    const supabase = createBrowserClient();

    const { error } = await supabase
      .from("apartments")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", deleteTarget.id);

    if (!error) {
      handleDelete(deleteTarget.id);
      setDeleteTarget(null);
    } else {
      console.error(error);
    }

    setDeleting(false);
  };

  return (
    <>
      <PropertiesTable
        properties={properties}
        onRowClick={(property) => router.push(`/landlord/properties/${property.id}`)}
        onRowIntent={(property) => router.prefetch(`/landlord/properties/${property.id}`)}
        onEditClick={(property) => openSheet(property, true)}
        onDeleteClick={(property) => setDeleteTarget(property)}
      />

      {selected ? (
        <PropertyDetailsSheet
          key={selected.id}
          selected={selected}
          openEditMode={openEditMode}
          onClose={closeSheet}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ) : null}

      <DeletePropertyModal 
        isOpen={!!deleteTarget}
        propertyName={deleteTarget?.name}
        isDeleting={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteTarget}
      />
    </>
  );
}
