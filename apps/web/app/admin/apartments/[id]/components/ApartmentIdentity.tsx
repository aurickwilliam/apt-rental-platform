"use client";

import { useRouter } from "next/navigation";
import { Button, Dropdown, toast } from "@heroui/react";
import {
  IconClock,
  IconDots,
  IconEye,
  IconEyeOff,
  IconHome,
  IconHomeCheck,
  IconMapPin,
  IconShieldCheckFilled,
  IconShieldX,
  IconTool,
} from "@tabler/icons-react";
import type { Apartment, Verification } from "../types";
import { dateOnly, StatusChip } from "./DetailPrimitives";

interface ApartmentIdentityProps {
  apartment: Apartment;
  verification: Verification | null;
  showReviewAction?: boolean;
  headingLevel?: "h1" | "h2";
}

export default function ApartmentIdentity({
  apartment,
  verification,
  showReviewAction = true,
  headingLevel = "h1",
}: ApartmentIdentityProps) {
  const router = useRouter();
  const address = [
    apartment.street_address,
    apartment.barangay,
    apartment.city,
    apartment.province,
  ]
    .filter(Boolean)
    .join(", ");
  const verificationStatus =
    verification?.status === "pending"
      ? "pending"
      : apartment.is_verified
        ? "verified"
        : verification?.status === "rejected"
          ? "rejected"
          : "unverified";
  const occupancyStatus =
    apartment.status === "available" ? "vacant" : apartment.status;
  const Heading = headingLevel;
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Heading className="text-primary font-nunito text-2xl font-bold wrap-break-word sm:text-3xl">
            {apartment.name}
          </Heading>
          <p className="mt-1 text-sm text-muted-foreground">
            <IconMapPin
              size={16}
              className="inline-block align-text-bottom mr-1"
              aria-hidden="true"
            />
            {address}{" "}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showReviewAction && verification?.status === "pending" ? (
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
                       .then(() => toast.success("Listing ID copied"))
                       .catch(() => toast.danger("Could not copy listing ID. Please try again."));
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

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mt-2">
        <div className="flex flex-wrap gap-2" aria-label="Apartment status">
          <StatusChip
            status={verificationStatus}
            icon={
              verificationStatus === "verified" ? (
                <IconShieldCheckFilled size={14} aria-hidden="true" />
              ) : verificationStatus === "pending" ? (
                <IconClock size={14} aria-hidden="true" />
              ) : (
                <IconShieldX size={14} aria-hidden="true" />
              )
            }
          />
          <StatusChip
            status={occupancyStatus}
            icon={
              occupancyStatus === "occupied" ? (
                <IconHomeCheck size={14} aria-hidden="true" />
              ) : occupancyStatus === "under_maintenance" ? (
                <IconTool size={14} aria-hidden="true" />
              ) : (
                <IconHome size={14} aria-hidden="true" />
              )
            }
          />
          <StatusChip
            status={apartment.is_hidden_by_admin ? "hidden" : "visible"}
            icon={
              apartment.is_hidden_by_admin ? (
                <IconEyeOff size={14} aria-hidden="true" />
              ) : (
                <IconEye size={14} aria-hidden="true" />
              )
            }
          />
        </div>
        <p className="text-xs text-muted-foreground sm:ml-auto sm:text-right">
          Created {dateOnly.format(new Date(apartment.created_at))}
          {apartment.updated_at
            ? ` · Updated ${dateOnly.format(new Date(apartment.updated_at))}`
            : ""}
        </p>
      </div>
    </div>
  );
}
