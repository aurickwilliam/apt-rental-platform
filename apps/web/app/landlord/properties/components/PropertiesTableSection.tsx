"use client";

import { useState } from "react";

import PropertiesTable from "./PropertiesTable";
import PropertyDetailsSheet from "./PropertyDetailsSheet";
import type { Property } from "./propertyTypes";

type Props = {
  properties: Property[];
};

export default function PropertiesTableSection({ properties: initial }: Props) {
  const [properties, setProperties] = useState<Property[]>(initial);
  const [selected, setSelected] = useState<Property | null>(null);
  const [openEditMode, setOpenEditMode] = useState(false);

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

  return (
    <>
      <PropertiesTable
        properties={properties}
        onRowClick={(property) => openSheet(property)}
        onEditClick={(property) => openSheet(property, true)}
        onDeleteClick={(property) => openSheet(property)}
      />

      <PropertyDetailsSheet
        selected={selected}
        openEditMode={openEditMode}
        onClose={closeSheet}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </>
  );
}
