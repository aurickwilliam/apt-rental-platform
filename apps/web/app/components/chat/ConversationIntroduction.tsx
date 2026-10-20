"use client";

import { buttonVariants } from "@heroui/react";
import Link from "next/link";
import { IconRosetteDiscountCheckFilled, IconShieldCheck } from "@tabler/icons-react";
import UserAvatar from "@/app/components/profile/UserAvatar";
import type { ConversationApartmentPresentation } from "@/lib/conversation-context";

interface ConversationIntroductionProps {
  contact: { name: string; avatar: string };
  role: "Tenant" | "Landlord";
  verified: boolean;
  apartment: ConversationApartmentPresentation;
}

export default function ConversationIntroduction({ contact, role, verified, apartment }: ConversationIntroductionProps) {
  return (
    <section data-conversation-introduction aria-label="Conversation introduction" className="mx-auto flex w-full max-w-md flex-col items-center gap-2 px-2 py-4 text-center">
      <UserAvatar src={contact.avatar} initials={contact.name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("")} alt={contact.name} size="md" />
      <h3 className="flex max-w-full items-center justify-center gap-1.5 font-nunito text-sm font-bold text-foreground">
        <span className="min-w-0 wrap-anywhere">{contact.name}</span>
        {verified ? <IconRosetteDiscountCheckFilled size={18} className="shrink-0 text-brand" role="img" aria-label="Verified account" /> : null}
      </h3>
      <p className="line-clamp-2 max-w-full font-inter text-xs text-muted-foreground wrap-anywhere" title={apartment?.title}>{role}{apartment ? ` · ${apartment.title}` : ""}</p>
      {apartment ? <Link href={apartment.href} className={buttonVariants({ variant: "tertiary", size: "sm" })}>View Apartment</Link> : null}
      <p className="mt-1 flex items-start justify-center gap-1.5 font-inter text-xs leading-5 text-muted-foreground"><IconShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true" /><span>Keep payments inside APT, never through chat.</span></p>
    </section>
  );
}
