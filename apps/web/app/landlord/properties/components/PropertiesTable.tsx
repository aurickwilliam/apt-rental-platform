"use client";
import Image from "next/image";

import { Button, Chip, Dropdown, Table } from "@heroui/react";
import { Star, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { STATUS_COLOR } from "./propertyConstants";
import type { Property } from "./propertyTypes";

type Props = {
  properties: Property[];
  onRowClick: (property: Property) => void;
  onEditClick: (property: Property) => void;
  onDeleteClick: (property: Property) => void;
};

export default function PropertiesTable({
  properties,
  onRowClick,
  onEditClick,
  onDeleteClick,
}: Props) {
  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
        <p className="text-base font-medium">No properties yet</p>
        <p className="text-sm">Add your first listing to get started</p>
      </div>
    );
  }

  return (
    <Table className="bg-darker-white">
      <Table.ScrollContainer>
        <Table.Content
          aria-label="Properties table"
          className="bg-darker-white"
          selectionMode="single"
          onRowAction={(key) => {
            const property = properties.find((p) => p.id === key);
            if (property) onRowClick(property);
          }}
        >
          <Table.Header className="bg-darker-white">
            <Table.Column className="w-16 text-black font-medium">
              Photo
            </Table.Column>
            <Table.Column isRowHeader className="text-black font-medium">
              Name
            </Table.Column>
            <Table.Column className="text-black font-medium">
              Location
            </Table.Column>
            <Table.Column className="text-black font-medium">
              Type
            </Table.Column>
            <Table.Column className="text-black font-medium">
              Price
            </Table.Column>
            <Table.Column className="text-black font-medium">
              Rating
            </Table.Column>
            <Table.Column className="text-black font-medium">
              Status
            </Table.Column>
            <Table.Column className="text-right text-black font-medium">
              Actions
            </Table.Column>
          </Table.Header>
    
          <Table.Body>
            {properties.map((property) => (
              <Table.Row
                key={property.id}
                id={property.id}
                className="cursor-pointer hover:bg-default-50"
              >
                <Table.Cell>
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                    <Image src={property.thumbnail} alt={property.name} fill className="object-cover" />
                  </div>
                </Table.Cell>

                <Table.Cell>
                  <p className="font-medium text-sm truncate max-w-40">{property.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {property.no_bedrooms ?? "—"} bed · {property.no_bathrooms ?? "—"} bath
                  </p>
                </Table.Cell>

                <Table.Cell>
                  <p className="text-sm">{property.barangay}</p>
                  <p className="text-xs text-muted-foreground">{property.city}</p>
                </Table.Cell>

                <Table.Cell>
                  <p className="text-sm">{property.type ?? "—"}</p>
                </Table.Cell>

                <Table.Cell>
                  <p className="text-sm font-medium text-primary">
                    ₱{property.monthly_rent?.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">/month</p>
                </Table.Cell>

                <Table.Cell>
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-400" fill="currentColor" />
                    <span className="text-sm">
                      {property.average_rating > 0 ? property.average_rating : "—"}
                    </span>
                  </div>
                </Table.Cell>

                <Table.Cell>
                  <Chip
                    size="sm"
                    variant="soft"
                    color={STATUS_COLOR[property.status] ?? "default"}
                    className="capitalize"
                  >
                    {property.status}
                  </Chip>
                </Table.Cell>

                <Table.Cell className="text-right">
                  <Dropdown>
                    <Button
                      isIconOnly
                      variant="tertiary"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal size={16} />
                    </Button>

                    <Dropdown.Popover>
                      <Dropdown.Menu
                        onAction={(key) => {
                          if (key === "edit") onEditClick(property);
                          if (key === "delete") onDeleteClick(property);
                        }}
                      >
                        <Dropdown.Item id="edit" textValue="Edit">
                          <div className="flex items-center gap-2">
                            <Pencil size={14} />
                            <span>Edit</span>
                          </div>
                        </Dropdown.Item>
                        <Dropdown.Item id="delete" textValue="Delete" variant="danger">
                          <div className="flex items-center gap-2">
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </div>
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown.Popover>
                  </Dropdown>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}