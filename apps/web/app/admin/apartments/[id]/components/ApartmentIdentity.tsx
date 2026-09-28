"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Dropdown } from "@heroui/react";
import { IconDots } from "@tabler/icons-react";
import type { Apartment, Verification } from "../types";
import { dateOnly, StatusChip } from "./DetailPrimitives";

interface ApartmentIdentityProps {
  apartment: Apartment;
  verification: Verification | null;
}

export default function ApartmentIdentity({
  apartment,
  verification,
}: ApartmentIdentityProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const address = [
    apartment.street_address,
    apartment.barangay,
    apartment.city,
    apartment.province,
  ]
    .filter(Boolean)
    .join(", ");
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-nunito text-2xl font-bold wrap-break-word sm:text-3xl">
            {apartment.name}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{address}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            ID {apartment.id} · Created{" "}
            {dateOnly.format(new Date(apartment.created_at))}
            {apartment.updated_at
              ? ` · Updated ${dateOnly.format(new Date(apartment.updated_at))}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {verification?.status === "pending" ? (
            <Button
              variant="primary"
              onPress={() =>
                router.push(`/admin/verification/apartments/${verification.id}`)
              }
            >
              Review verification
            </Button>
          ) : null}
          <Dropdown>
            <Button
              variant="outline"
              isIconOnly
              aria-label="More apartment actions"
            >
              <IconDots size={20} aria-hidden="true" />
            </Button>
            <Dropdown.Popover>
              <Dropdown.Menu
                onAction={(key) => {
                  if (key === "copy") {
                    void navigator.clipboard
                      .writeText(apartment.id)
                      .then(() => setCopied(true))
                      .catch(() => setCopied(false));
                  }
                }}
              >
                <Dropdown.Item id="copy" textValue="Copy listing ID">
                  Copy listing ID
                </Dropdown.Item>
                {!apartment.is_hidden_by_admin ? (
                  <Dropdown.Item
                    id="public"
                    textValue="View public listing"
                    href={`/browse/${apartment.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View public listing
                  </Dropdown.Item>
                ) : null}
                <Dropdown.Item
                  id="activity"
                  textValue="View activity"
                  href="/admin/activity"
                >
                  View activity
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </div>
      {copied ? (
        <span role="status" className="text-xs text-primary">
          Listing ID copied
        </span>
      ) : null}
      <div className="flex flex-wrap gap-2" aria-label="Apartment status">
        <StatusChip
          status={
            verification?.status === "pending"
              ? "pending"
              : apartment.is_verified
                ? "verified"
                : verification?.status === "rejected"
                  ? "rejected"
                  : "unverified"
          }
        />
        <StatusChip
          status={
            apartment.status === "available" ? "vacant" : apartment.status
          }
        />
        <StatusChip
          status={apartment.is_hidden_by_admin ? "hidden" : "visible"}
        />
      </div>
    </div>
  );
}
