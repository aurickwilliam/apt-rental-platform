"use client";

import Link from "next/link";
import { Button } from "@heroui/react";
import {
  IconFileText,
  IconHome,
  IconMessageCircle,
  IconReceipt,
  IconTool,
  type Icon,
} from "@tabler/icons-react";

interface QuickActionBase {
  id: string;
  label: string;
  /** Shown beside the label once the tiles have room for it. */
  hint: string;
  icon: Icon;
}

type QuickAction =
  | (QuickActionBase & { href: string })
  | (QuickActionBase & { onPress: () => void });

interface RentalQuickActionsProps {
  apartmentId: string;
  /** Link to the landlord conversation; null hides the Message tile. */
  messageHref: string | null;
  /** Opens the private signed lease (the page owns the viewer state). */
  onViewSignedLease: () => void;
}

// Phone: mobile's icon-over-caption tile. From 56rem of page width: a bordered
// row tile with the icon beside its label and hint.
const TILE_CLASS = [
  "group flex w-full min-w-0 cursor-pointer flex-col items-center gap-1.5 rounded-2xl p-1 text-center no-underline",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
  "@min-[56rem]/rental:flex-row @min-[56rem]/rental:gap-3 @min-[56rem]/rental:border @min-[56rem]/rental:border-border",
  "@min-[56rem]/rental:bg-card @min-[56rem]/rental:p-3 @min-[56rem]/rental:text-left @min-[56rem]/rental:transition-colors",
  "@min-[56rem]/rental:hover:border-primary/40",
].join(" ");

function TileContent({ icon: TileIcon, label, hint }: Pick<QuickActionBase, "icon" | "label" | "hint">) {
  return (
    <>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
        <TileIcon size={22} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="line-clamp-2 block text-[12px] leading-4 font-inter text-card-foreground @min-[56rem]/rental:font-nunito @min-[56rem]/rental:text-sm @min-[56rem]/rental:font-semibold">
          {label}
        </span>
        <span className="hidden font-inter text-xs leading-4 text-muted-foreground @min-[56rem]/rental:line-clamp-2">
          {hint}
        </span>
      </span>
    </>
  );
}

/** Mobile's Quick Actions row; desktop tiles add a one-line hint. */
export default function RentalQuickActions({ apartmentId, messageHref, onViewSignedLease }: RentalQuickActionsProps) {
  const actions: QuickAction[] = [
    { id: "receipts", label: "Receipts", hint: "View payment receipts", icon: IconReceipt, href: "/tenant/payment/history" },
    { id: "repairs", label: "Repairs", hint: "Request maintenance", icon: IconTool, href: "/tenant/maintenance" },
    ...(messageHref
      ? [{ id: "message-landlord", label: "Message landlord", hint: "Open your conversation", icon: IconMessageCircle, href: messageHref }]
      : []),
    { id: "signed-lease", label: "Signed lease", hint: "Open your contract", icon: IconFileText, onPress: onViewSignedLease },
    { id: "my-rental", label: "My rental", hint: "Apartment details", icon: IconHome, href: `/tenant/browse/${apartmentId}` },
  ];

  return (
    <section aria-labelledby="rental-quick-actions" className="min-w-0">
      <h2 id="rental-quick-actions" className="font-nunito text-lg font-semibold text-foreground">
        Quick actions
      </h2>
      <div className="rental-quick-actions mt-2 grid grid-cols-3 gap-2 @min-[44rem]/rental:grid-flow-col @min-[44rem]/rental:auto-cols-fr @min-[44rem]/rental:grid-cols-none @min-[56rem]/rental:gap-3">
        {actions.map((action) =>
          "href" in action ? (
            <Link key={action.id} href={action.href} className={TILE_CLASS}>
              <TileContent icon={action.icon} label={action.label} hint={action.hint} />
            </Link>
          ) : (
            <Button key={action.id} variant="ghost" onPress={action.onPress} className={`button--bare ${TILE_CLASS}`}>
              <TileContent icon={action.icon} label={action.label} hint={action.hint} />
            </Button>
          ),
        )}
      </div>
    </section>
  );
}
