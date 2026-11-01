"use client";

import { Button, toast } from "@heroui/react";
import { IconCopy, IconMail, IconMessage, IconPhone } from "@tabler/icons-react";

import StatusChip from "@/app/components/display/StatusChip";

import type { PublicProfileContact } from "./types";

interface PublicProfileContactCardProps {
  contact: PublicProfileContact;
  /** Cities with listings; shown as chips under the contact rows. */
  areas?: string[];
  /** First name for the Message button. */
  displayName?: string;
  /** When set, a signed-in tenant gets the Message action. */
  onMessagePress?: () => void;
}

const EMPTY_VALUE = "Not provided";

function telHref(value: string): string {
  return `tel:${value.replace(/[^\d+]/g, "")}`;
}

// Order is deliberate: the two direct contact details first, then the in-app
// message action, so a tenant can call or email without scrolling past it.
export default function PublicProfileContactCard({
  contact,
  areas = [],
  displayName,
  onMessagePress,
}: PublicProfileContactCardProps) {
  const rows = [
    { label: "Mobile number", value: contact.mobileNumber, Icon: IconPhone, href: contact.mobileNumber ? telHref(contact.mobileNumber) : null },
    { label: "Email address", value: contact.email, Icon: IconMail, href: contact.email ? `mailto:${contact.email}` : null },
  ];

  const copyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.danger("Couldn't copy", { description: "Copy it manually instead." });
    }
  };

  return (
    <section
      aria-label="Contact information"
      className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-4 sm:p-5"
    >
      <h2 className="font-nunito text-base font-bold">Contact {displayName ?? "landlord"}</h2>

      {rows.map(({ label, value, Icon, href }) => (
        <div key={label} className="flex items-center gap-3">
          <Icon size={20} className="shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            {value ? (
              href ? (
                <a
                  href={href}
                  className="font-nunito text-base font-semibold wrap-anywhere hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {value}
                </a>
              ) : (
                <p className="font-nunito text-base font-semibold wrap-anywhere">{value}</p>
              )
            ) : (
              <p className="font-nunito text-base font-semibold wrap-anywhere">{EMPTY_VALUE}</p>
            )}
          </div>
          {value && href ? (
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              aria-label={`Copy ${label.toLowerCase()}`}
              onPress={() => void copyValue(value, label)}
            >
              <IconCopy size={16} className="text-muted-foreground" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      ))}

      {onMessagePress ? (
        <Button variant="primary" size="lg" fullWidth onPress={onMessagePress}>
          <IconMessage size={18} aria-hidden="true" />
          Message {displayName ?? "landlord"}
        </Button>
      ) : null}

      {areas.length > 0 ? (
        <div className="border-t border-border pt-3">
          <p className="text-xs text-muted-foreground">Areas covered</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {areas.map((area) => (
              <li key={area}>
                <StatusChip size="sm" tone="neutral">
                  {area}
                </StatusChip>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
