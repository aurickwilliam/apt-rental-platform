"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import {
  IconFileText,
  IconHeart,
  IconHome,
  IconMessageCircle,
  IconPencil,
  IconReceipt,
  IconSearch,
  IconTool,
  IconUser,
  type Icon,
} from "@tabler/icons-react";

import { useRentalQuickActions } from "@/hooks/use-rental-quick-actions";
import type { RentalQuickActionId } from "@/lib/rental-quick-actions";

import DashboardCard from "./DashboardCard";
import RentalQuickActionsEditor, { type QuickActionOption } from "./RentalQuickActionsEditor";

type QuickAction = QuickActionOption & ({ href: string } | { onPress: () => void });

interface RentalQuickActionsProps {
  /** Keys the saved choice; without it the defaults show and cannot be changed. */
  authUserId: string | null | undefined;
  apartmentId: string;
  /** Link to the landlord conversation; null makes Message landlord unavailable. */
  messageHref: string | null;
  /** Opens the private signed lease (the page owns the viewer state). */
  onViewSignedLease: () => void;
}

// Mobile's tile at every width: a neutral icon square over a short caption.
const TILE_CLASS = [
  "group flex w-full min-w-0 cursor-pointer flex-col items-center gap-1.5 rounded-2xl p-1 text-center no-underline",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
].join(" ");

function TileContent({ icon: TileIcon, label }: Pick<QuickActionOption, "icon" | "label">) {
  return (
    <>
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
        <TileIcon size={22} aria-hidden="true" />
      </span>
      <span className="line-clamp-2 block min-w-0 font-inter text-[12px] leading-4 text-card-foreground">{label}</span>
    </>
  );
}

function action(id: RentalQuickActionId, label: string, hint: string, icon: Icon): QuickActionOption {
  return { id, label, hint, icon };
}

/** Mobile's Quick Actions row: up to five shortcuts the tenant chooses with the pencil. */
export default function RentalQuickActions({ authUserId, apartmentId, messageHref, onViewSignedLease }: RentalQuickActionsProps) {
  const { ids, save } = useRentalQuickActions(authUserId);
  const [editing, setEditing] = useState(false);

  const catalog: QuickAction[] = [
    { ...action("receipts", "Receipts", "View payment receipts", IconReceipt), href: "/tenant/payment/history" },
    { ...action("repairs", "Repairs", "Request maintenance", IconTool), href: "/tenant/maintenance" },
    {
      ...action("message-landlord", "Message landlord", "Open your conversation", IconMessageCircle),
      href: messageHref ?? "/tenant/messages",
      unavailableReason: messageHref ? undefined : "Available once landlord details load",
    },
    { ...action("signed-lease", "Signed lease", "Open your contract", IconFileText), onPress: onViewSignedLease },
    { ...action("my-rental", "My rental", "Apartment details", IconHome), href: `/tenant/browse/${apartmentId}` },
    { ...action("favorites", "Favorites", "View saved apartments", IconHeart), href: "/tenant/favorites" },
    { ...action("browse", "Browse", "Find other apartments", IconSearch), href: "/tenant/browse" },
    { ...action("profile", "Profile", "View your profile", IconUser), href: "/tenant/profile" },
  ];
  const shown = ids
    .map((id) => catalog.find((item) => item.id === id))
    .filter((item): item is QuickAction => Boolean(item) && !item?.unavailableReason);

  return (
    <DashboardCard>
      <section aria-labelledby="rental-quick-actions" className="min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h2 id="rental-quick-actions" className="font-nunito text-lg font-semibold text-card-foreground">
            Quick actions
          </h2>
          {authUserId ? (
            <Button
              isIconOnly
              variant="ghost"
              size="sm"
              aria-label="Customize quick actions"
              onPress={() => setEditing(true)}
              className="cursor-pointer text-muted-foreground"
            >
              <IconPencil size={18} aria-hidden="true" />
            </Button>
          ) : null}
        </div>
        {shown.length > 0 ? (
          <div className="rental-quick-actions mt-2 grid grid-cols-5 gap-1">
            {shown.map((item) =>
              "href" in item ? (
                <Link key={item.id} href={item.href} className={TILE_CLASS}>
                  <TileContent icon={item.icon} label={item.label} />
                </Link>
              ) : (
                <Button key={item.id} variant="ghost" onPress={item.onPress} className={`button--bare ${TILE_CLASS}`}>
                  <TileContent icon={item.icon} label={item.label} />
                </Button>
              ),
            )}
          </div>
        ) : (
          <p className="mt-2 font-inter text-sm text-muted-foreground">
            No quick actions chosen. Use the pencil to add some.
          </p>
        )}
      </section>
      {editing && (
        <RentalQuickActionsEditor
          options={catalog}
          selectedIds={ids}
          onSave={save}
          onClose={() => setEditing(false)}
        />
      )}
    </DashboardCard>
  );
}
