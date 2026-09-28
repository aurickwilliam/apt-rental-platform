"use client";

import { useState } from "react";
import { Button, Card, Separator } from "@heroui/react";
import { IconCheck, IconCopy, IconUser } from "@tabler/icons-react";
import {
  formatUserAddress,
  getAge,
  getFullName,
  joinedFormatter,
  type AdminUserDetail,
} from "../../lib/user-display";
import { InfoField } from "./UserDetailPrimitives";

interface UserPersonalInfoProps {
  user: AdminUserDetail;
}

export default function UserPersonalInfo({ user }: UserPersonalInfoProps) {
  const age = getAge(user.birth_date);
  const [copied, setCopied] = useState(false);

  async function copyId() {
    try {
      await navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }
  return (
    <Card className="rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">
      <Card.Content className="p-0">
        <h2 className="flex items-center gap-2 font-nunito text-lg font-bold text-primary">
          <IconUser
            size={20}
            className="shrink-0 text-primary"
            aria-hidden="true"
          />
          Personal information
        </h2>
        <dl className="mt-3 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <InfoField label="Full name" value={getFullName(user)} />
          <InfoField label="Email" value={user.email ?? "Not provided"} />
          <InfoField
            label="Mobile"
            value={user.mobile_number ?? "Not provided"}
          />
          <InfoField
            label="Gender"
            value={user.gender ? user.gender : "Not provided"}
          />
          <InfoField
            label="Birth date"
            value={
              user.birth_date
                ? `${joinedFormatter.format(new Date(user.birth_date))}${age !== null ? ` (${age} y/o)` : ""}`
                : "Not provided"
            }
          />
        </dl>
        <Separator className="my-4" />
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-2">
            <InfoField label="Address" value={formatUserAddress(user)} />
          </div>
          <InfoField
            label="Postal code"
            value={user.postal_code ? String(user.postal_code) : "—"}
          />
        </dl>
        <Separator className="my-4" />
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-2">
            <dt className="text-xs text-muted-foreground">Internal ID</dt>
            <dd className="mt-0.5 flex w-fit max-w-full items-center gap-2">
              <span className="min-w-0 truncate font-mono text-sm font-medium">
                {user.id}
              </span>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                className="shrink-0"
                aria-label={copied ? "Copied" : "Copy internal ID"}
                onPress={copyId}
              >
                {copied ? (
                  <IconCheck size={16} aria-hidden="true" />
                ) : (
                  <IconCopy size={16} aria-hidden="true" />
                )}
              </Button>
            </dd>
          </div>
          <InfoField
            label="Last updated"
            value={
              user.updated_at
                ? joinedFormatter.format(new Date(user.updated_at))
                : "—"
            }
          />
        </dl>
      </Card.Content>
    </Card>
  );
}
