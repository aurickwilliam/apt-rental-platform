"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button, Chip } from "@heroui/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu";

import { Star, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";

type Property = {
  id:           string;
  name:         string;
  city:         string;
  barangay:     string;
  price:        number;
  status:       string;
  type:         string;
  rating:       number;
  no_bedrooms:  number;
  no_bathrooms: number;
  thumbnail:    string;
};

type Props = {
  properties: Property[];
};

const STATUS_COLOR: Record<string, "success" | "warning" | "default"> = {
  verified:   "success",
  unverified: "warning",
  occupied:   "default",
};

export default function PropertiesTable({ properties }: Props) {
  const router = useRouter();

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
        <p className="text-base font-medium">No properties yet</p>
        <p className="text-sm">Add your first listing to get started</p>
      </div>
    );
  }

  return (
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
          <TableRow key={property.id}>
            {/* Thumbnail */}
            <TableCell>
              <div className="w-12 h-12 rounded-lg overflow-hidden relative shrink-0">
                <Image
                  src={property.thumbnail}
                  alt={property.name}
                  fill
                  className="object-cover"
                />
              </div>
            </TableCell>

            {/* Name */}
            <TableCell>
              <p className="font-medium text-sm truncate max-w-40">{property.name}</p>
              <p className="text-xs text-muted-foreground">
                {property.no_bedrooms} bed · {property.no_bathrooms} bath
              </p>
            </TableCell>

            {/* Location */}
            <TableCell>
              <p className="text-sm">{property.barangay}</p>
              <p className="text-xs text-muted-foreground">{property.city}</p>
            </TableCell>

            {/* Type */}
            <TableCell>
              <p className="text-sm">{property.type}</p>
            </TableCell>

            {/* Price */}
            <TableCell>
              <p className="text-sm font-medium text-primary">
                ₱{property.price?.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">/month</p>
            </TableCell>

            {/* Rating */}
            <TableCell>
              <div className="flex items-center gap-1">
                <Star size={14} className="text-yellow-400" fill="currentColor" />
                <span className="text-sm">{property.rating > 0 ? property.rating : "—"}</span>
              </div>
            </TableCell>

            {/* Status */}
            <TableCell>
              <Chip
                size="sm"
                variant="flat"
                color={STATUS_COLOR[property.status] ?? "default"}
                className="capitalize"
              >
                {property.status}
              </Chip>
            </TableCell>

            {/* Actions */}
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button isIconOnly variant="light" size="sm" radius="full">
                    <MoreHorizontal size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer"
                    onClick={() => router.push(`/browse/${property.id}`)}
                  >
                    <Eye size={14} /> View
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer"
                    onClick={() => router.push(`/properties/${property.id}/edit`)}
                  >
                    <Pencil size={14} /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer text-danger focus:text-danger"
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
  );
}