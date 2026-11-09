"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  IconBell,
  IconCreditCard,
  IconHelpCircle,
  IconHome,
  IconRoute,
  IconSettings,
  IconShieldLock,
  IconSun,
} from "@tabler/icons-react";
import { AlertDialog, Button, Modal } from "@heroui/react";

import type { TranslationKey } from "@repo/i18n";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import { useUser } from "@/hooks/use-user";
import { useRentalPreferencesForm } from "@/hooks/use-rental-preferences-form";
import GeneralTab from "./tabs/GeneralTab";
import SecurityTab from "./tabs/SecurityTab";
import NotificationsTab from "./tabs/NotificationsTab";
import HelpTab from "./tabs/HelpTab";
import RentalPreferencesTab from "./tabs/RentalPreferencesTab";
import PaymentMethodsTab from "./tabs/PaymentMethodsTab";
import TutorialTab from "./tabs/TutorialTab";

type TabId = "general" | "security" | "notifications" | "help" | "rental" | "payments" | "tutorial";

const TAB_META = [
  { id: "general", labelKey: "settings.general", icon: IconSun },
  { id: "security", labelKey: "settings.security", icon: IconShieldLock },
  { id: "notifications", labelKey: "settings.notifications", icon: IconBell },
  { id: "help", labelKey: "settings.help", icon: IconHelpCircle },
] as const satisfies readonly { id: TabId; labelKey: TranslationKey; icon: typeof IconSun }[];

const RENTAL_TAB = {
  id: "rental",
  labelKey: "settings.rentalPreferences",
  icon: IconHome,
} as const satisfies { id: TabId; labelKey: TranslationKey; icon: typeof IconHome };
const PAYMENTS_TAB = { id: "payments", labelKey: "settings.paymentMethods", icon: IconCreditCard } as const;
const TUTORIAL_TAB = { id: "tutorial", labelKey: "settings.tutorial", icon: IconRoute } as const;

export default function SettingsModal({
  open,
  onClose,
  initialRoles,
  activePortal,
  requestedRental = false,
  onChangePassword,
  onChangeEmail,
  onStartTutorial,
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
  /**
   * Deep-link intent from `?settingsTab=rental` (the recommendation empty
   * state's "Update preferences" action). Owned by `SettingsOverlay`, which
   * also clears the query when the dialog closes, so the intent can never
   * outlive one open.
   */
  requestedRental?: boolean;
  onChangePassword: () => void;
  onChangeEmail: () => void;
  /** Closes Settings and replays the active portal's tutorial. */
  onStartTutorial: (portal: "tenant" | "landlord") => void;
}) {
  const { t } = useTranslation();
  const { profile, loading: profileLoading } = useUser();
  const pathname = usePathname();
  const roles = profileLoading ? (initialRoles ?? []) : (profile?.roles ?? []);
  const isAdmin = roles.includes("admin");
  const isTenant = roles.includes("tenant");
  const isLandlord = roles.includes("landlord");
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
  const [tab, setTab] = useState<TabId>(requestedRental ? "rental" : "general");
  // Apply the deep-link intent once roles can see the tab. On public pages
  // roles arrive from the client profile after the dialog opens, so watching
  // only `open`/`requestedRental` could drop a valid intent; watching
  // `canShowRental` too applies it as soon as it becomes possible, without
  // overriding a later manual tab switch.
  const [previousIntent, setPreviousIntent] = useState({
    open,
    requestedRental,
    canShowRental,
  });
  if (
    previousIntent.open !== open ||
    previousIntent.requestedRental !== requestedRental ||
    previousIntent.canShowRental !== canShowRental
  ) {
    setPreviousIntent({ open, requestedRental, canShowRental });
    if (open && requestedRental && canShowRental) setTab("rental");
  }

  // Rental-preferences draft lives at the modal level (not inside the tab)
  // so switching Settings tabs never discards in-progress edits. The tab
  // itself unmounts on switch via key={activeId} below. The form reuses
  // this modal's already-loaded profile instead of fetching it again.
  const rentalForm = useRentalPreferencesForm(profile?.preferences);

  // Rental Preferences sits second for tenants; everyone else keeps the
  // same relative order without it. Landlord/admin portals never list it,
  // so a stale "rental" selection safely falls back to General below.
  const baseTabs = canShowRental
    ? [TAB_META[0], RENTAL_TAB, ...TAB_META.slice(1)]
    : TAB_META;
  // Payment Methods (which methods tenants may use) is landlord-portal-only.
  const canShowPayments = isLandlord && resolvedPortal === "landlord";
  const withPayments = canShowPayments ? [...baseTabs.slice(0, 2), PAYMENTS_TAB, ...baseTabs.slice(2)] : baseTabs;
  // The tutorial belongs to the tenant and landlord portals (the account must
  // hold that portal's role); admin and neutral pages never list it.
  const tutorialPortal =
    resolvedPortal === "tenant" && isTenant
      ? "tenant"
      : resolvedPortal === "landlord" && isLandlord
        ? "landlord"
        : null;
  const visibleTabs = tutorialPortal
    ? [...withPayments.slice(0, withPayments.length - 1), TUTORIAL_TAB, withPayments[withPayments.length - 1]]
    : withPayments;
  const activeId: TabId = visibleTabs.some((item) => item.id === tab) ? tab : "general";
  const categoryNavRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const nav = categoryNavRef.current;
    if (!nav) return;
    const revealSelected = () => {
      if (!window.matchMedia("(max-width: 767px)").matches) return;
      nav.querySelector<HTMLButtonElement>('[aria-current="page"]')?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: "instant",
      });
    };
    revealSelected();
    const observer = new ResizeObserver(revealSelected);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [activeId, open, canShowRental]);

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
              aria-label={t("settings.close")}
              className="text-foreground"
            />
            <Modal.Header className="shrink-0 border-b border-border px-5 py-4 pr-12">
              <Modal.Heading className="font-nunito text-2xl text-primary font-bold flex flex-row items-center">
                <IconSettings
                  size={28}
                  className="mr-2 inline"
                  aria-hidden="true"
                />
                {t("settings.title")}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="mx-0! mt-0! min-h-0 min-w-0 overflow-hidden! p-0">
              <div className="flex h-full min-h-0 flex-col md:flex-row">
                <nav
                  ref={categoryNavRef}
                  aria-label={t("settings.sections")}
                  className="settings-category-nav flex min-w-0 shrink-0 justify-start gap-1 overflow-x-auto border-b border-border bg-muted/40 p-3 md:w-52 md:flex-col md:overflow-x-hidden md:overflow-y-auto md:border-r md:border-b-0"
                >
                  {visibleTabs.map(({ id, labelKey, icon: Icon }, index) => {
                    return (
                      <Fragment key={id}>
                        <Button
                          variant="ghost"
                          aria-current={activeId === id ? "page" : undefined}
                          onClick={() => setTab(id)}
                           className={`settings-category-button button--bare flex min-h-11 shrink-0 cursor-pointer items-center justify-start gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeId === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-primary/10 hover:text-primary"}`}
                        >
                          <Icon size={18} aria-hidden="true" />
                           <span className="min-w-0">{t(labelKey)}</span>
                        </Button>
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
                  aria-label={t(
                    visibleTabs.find(({ id }) => id === activeId)?.labelKey ??
                      "settings.general",
                  )}
                  className="mr-1.5 min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5"
                >
                  {activeId === "general" ? <GeneralTab /> : null}
                  {activeId === "security" ? <SecurityTab isAdmin={isAdmin} activePortal={resolvedPortal} onChangePassword={onChangePassword} onChangeEmail={onChangeEmail} /> : null}
                  {activeId === "notifications" ? <NotificationsTab isAdmin={isAdmin} /> : null}
                  {activeId === "help" ? <HelpTab isAdmin={isAdmin} activePortal={resolvedPortal} /> : null}
                  {activeId === "rental" && canShowRental ? <RentalPreferencesTab form={rentalForm} /> : null}
                  {activeId === "payments" && canShowPayments ? <PaymentMethodsTab /> : null}
                  {activeId === "tutorial" && tutorialPortal ? (
                    <TutorialTab portal={tutorialPortal} onStart={() => onStartTutorial(tutorialPortal)} />
                  ) : null}
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
                <AlertDialog.Heading>{t("settings.discard.title")}</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t("settings.discard.body")}
                </p>
              </AlertDialog.Body>
              <AlertDialog.Footer>
                <Button type="button" variant="outline" onPress={keepEditing}>
                  {t("settings.discard.keepEditing")}
                </Button>
                <Button type="button" variant="primary" onPress={discardAndClose}>
                  {t("settings.discard.confirm")}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </>
  );
}
