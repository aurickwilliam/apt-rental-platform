"use client";

import { Fragment, useState } from "react";
import { usePathname } from "next/navigation";
import {
  IconBell,
  IconGlobe,
  IconHelpCircle,
  IconHome,
  IconSettings,
  IconShieldLock,
  IconSun,
} from "@tabler/icons-react";
import { AlertDialog, Button, Modal } from "@heroui/react";

import { useUser } from "@/hooks/use-user";
import { useRentalPreferencesForm } from "@/hooks/use-rental-preferences-form";
import GeneralTab from "./tabs/GeneralTab";
import SecurityTab from "./tabs/SecurityTab";
import LanguageRegionTab from "./tabs/LanguageRegionTab";
import NotificationsTab from "./tabs/NotificationsTab";
import HelpTab from "./tabs/HelpTab";
import RentalPreferencesTab from "./tabs/RentalPreferencesTab";

type TabId = "general" | "security" | "language" | "notifications" | "help" | "rental";

const TAB_META = [
  { id: "general", label: "General", icon: IconSun },
  { id: "security", label: "Security", icon: IconShieldLock },
  { id: "notifications", label: "Notifications", icon: IconBell },
  { id: "language", label: "Language & Region", icon: IconGlobe },
  { id: "help", label: "Help & Support", icon: IconHelpCircle },
] as const;

const RENTAL_TAB = { id: "rental", label: "Rental Preferences", icon: IconHome } as const;

export default function SettingsModal({
  open,
  onClose,
  initialRoles,
  activePortal,
  onChangePassword,
  onChangeEmail,
}: {
  open: boolean;
  onClose: () => void;
  /**
   * Account roles already known server-side (portal layouts pass their
   * fetched roles). Seeds tab visibility on first paint so tenant tabs
   * render immediately instead of popping in after the client profile
   * loads. The client profile always wins once settled; this only affects
   * which tab buttons are shown, never data access.
   */
  initialRoles?: string[];
  /**
   * Portal this Settings instance belongs to (portal layouts pass their
   * static portal, mirroring `AppSidebar activePortal`). Rental Preferences
   * is tenant-portal-only, so a dual-role account on `/landlord/*` never
   * sees it. The live pathname wins over this prop so portal switches via
   * client navigation apply without a full page reload.
   */
  activePortal?: "tenant" | "landlord" | "admin";
  onChangePassword: () => void;
  onChangeEmail: () => void;
}) {
  const { profile, loading: profileLoading } = useUser();
  const pathname = usePathname();
  const roles = profileLoading ? (initialRoles ?? []) : (profile?.roles ?? []);
  const isAdmin = roles.includes("admin");
  const isTenant = roles.includes("tenant");
  // Active portal from the live route (client navigation) with the layout
  // prop as fallback for the first paint before the router hydrates.
  const routePortal =
    pathname?.startsWith("/landlord") === true
      ? "landlord"
      : pathname?.startsWith("/tenant") === true
        ? "tenant"
        : pathname?.startsWith("/admin") === true
          ? "admin"
          : null;
  const resolvedPortal = routePortal ?? activePortal ?? null;
  // Rental Preferences is tenant-portal-only. Neutral surfaces (public
  // pages with no portal) keep the role-based behavior; landlord and admin
  // portals never show it even for dual-role accounts. Preferences data
  // itself is untouched — the tab is only hidden.
  const canShowRental =
    isTenant && resolvedPortal !== "landlord" && resolvedPortal !== "admin";
  const [tab, setTab] = useState<TabId>("general");

  // Rental-preferences draft lives at the modal level (not inside the tab)
  // so switching Settings tabs never discards in-progress edits. The tab
  // itself unmounts on switch via key={activeId} below. The form reuses
  // this modal's already-loaded profile instead of fetching it again.
  const rentalForm = useRentalPreferencesForm(profile?.preferences);

  // Rental Preferences sits second for tenants; everyone else keeps the
  // same relative order without it. Landlord/admin portals never list it,
  // so a stale "rental" selection safely falls back to General below.
  const visibleTabs = canShowRental
    ? [TAB_META[0], RENTAL_TAB, ...TAB_META.slice(1)]
    : TAB_META;
  const activeId: TabId = visibleTabs.some((t) => t.id === tab) ? tab : "general";

  // Whether roles are still resolving without server-known seeds: reserve
  // the second slot (where the tenant-only tab lands) so it never pops
  // the list down. Unlabeled and non-interactive.
  const showTabPlaceholder = profileLoading && initialRoles === undefined;

  // Closing with unsaved preference edits asks for confirmation instead of
  // silently discarding them. A confirmed close resets the draft so the
  // next open starts from the saved preferences. Close requests during an
  // active save are ignored so a pending save can never be lost.
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const requestClose = () => {
    if (rentalForm.isSaving && canShowRental) return;
    if (!canShowRental || !rentalForm.isDirty) {
      onClose();
      return;
    }
    setShowDiscardConfirm(true);
  };

  const keepEditing = () => setShowDiscardConfirm(false);

  const discardAndClose = () => {
    setShowDiscardConfirm(false);
    rentalForm.reset();
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={open}
        onOpenChange={(value) => {
          if (!value) requestClose();
        }}
      >
      <Modal.Backdrop>
        <Modal.Container
          placement="center"
          size="lg"
          scroll="inside"
          className="w-full max-w-5xl sm:w-full"
        >
          <Modal.Dialog className="h-[calc(100dvh-2rem)] w-full max-w-5xl! overflow-hidden rounded-3xl bg-card p-0 md:h-[85dvh]">
            <Modal.CloseTrigger
              aria-label="Close settings"
              className="text-foreground"
            />
            <Modal.Header className="shrink-0 border-b border-border px-5 py-4 pr-12">
              <Modal.Heading className="font-nunito text-2xl text-primary font-bold flex flex-row items-center">
                <IconSettings
                  size={28}
                  className="mr-2 inline"
                  aria-hidden="true"
                />
                Settings
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="mt-0! min-h-0 overflow-hidden! p-0">
              <div className="flex h-full min-h-0 flex-col md:flex-row">
                <nav
                  aria-label="Settings sections"
                  className="flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-muted/40 p-3 md:w-52 md:flex-col md:overflow-x-hidden md:overflow-y-auto md:border-r md:border-b-0"
                >
                  {visibleTabs.map(({ id, label, icon: Icon }, index) => {
                    return (
                      <Fragment key={id}>
                        <button
                          type="button"
                          aria-current={activeId === id ? "page" : undefined}
                          onClick={() => setTab(id)}
                          className={`flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeId === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-primary/10 hover:text-primary"}`}
                        >
                          <Icon size={18} aria-hidden="true" />
                          {label}
                        </button>
                        {/* Placeholder occupies the second slot (right after
                          General) while roles resolve. */}
                        {index === 0 && showTabPlaceholder ? (
                          <div
                            aria-hidden="true"
                            className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 py-2"
                          >
                            <div className="h-4 flex-1 animate-pulse rounded-md bg-muted" />
                          </div>
                        ) : null}
                      </Fragment>
                    );
                  })}
                </nav>
                <section
                  key={activeId}
                  aria-label={visibleTabs.find(({ id }) => id === activeId)?.label}
                  className="mr-1.5 min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5"
                >
                  {activeId === "general" ? <GeneralTab /> : null}
                  {activeId === "security" ? <SecurityTab isAdmin={isAdmin} onChangePassword={onChangePassword} onChangeEmail={onChangeEmail} /> : null}
                  {activeId === "language" ? <LanguageRegionTab /> : null}
                  {activeId === "notifications" ? <NotificationsTab isAdmin={isAdmin} /> : null}
                  {activeId === "help" ? <HelpTab isAdmin={isAdmin} /> : null}
                  {activeId === "rental" && canShowRental ? <RentalPreferencesTab form={rentalForm} /> : null}
                </section>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>

      {/* Discard confirmation. Rendered after the Settings modal so it
        layers above it; RAC keeps the background modal inert and traps
        focus here. Backdrop click and Escape both resolve to Keep editing,
        and the draft is untouched unless Discard is chosen. */}
      <AlertDialog
        isOpen={showDiscardConfirm}
        onOpenChange={(value) => {
          if (!value) keepEditing();
        }}
      >
        <AlertDialog.Backdrop isDismissable isKeyboardDismissDisabled={false}>
          <AlertDialog.Container placement="center" size="sm">
            <AlertDialog.Dialog>
              <AlertDialog.Header>
                <AlertDialog.Heading>Discard changes?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm leading-6 text-muted-foreground">
                  You have unsaved rental preferences. Your changes will be
                  lost if you leave without saving.
                </p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button type="button" variant="outline" onPress={keepEditing}>
                  Keep editing
                </Button>
                <Button type="button" variant="primary" onPress={discardAndClose}>
                  Discard changes
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </>
  );
}
