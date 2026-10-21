"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import type { Icon as LucideIcon } from "@tabler/icons-react";
import {
  IconArrowsExchange,
  IconBell,
  IconBuilding,
  IconBuildingEstate,
  IconCashBanknote,
  IconChartBar,
  IconFileCheck,
  IconFileText,
  IconFlag,
  IconHeart,
  IconHistory,
  IconHome,
  IconLayoutDashboard,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconLogout,
  IconMenu2,
  IconMessageCircle,
  IconMessages,
  IconMoon,
  IconSearch,
  IconSettings,
  IconSelector,
  IconShieldCheck,
  IconSun,
  IconTool,
  IconUsers,
  IconUser,
  type Icon as TablerIcon,
} from "@tabler/icons-react";

import { Button, Dropdown, Label, Separator, Spinner } from "@heroui/react";
import { IconArrowsExchange as ArrowLeftRight, IconLogout as LogOut, IconSelector as ChevronsUpDown, IconSearch as Search, IconSettings as Settings, IconSun as Sun, IconHome as House, IconFileText as FileText, IconHeart as Heart, IconTool as Wrench, IconMessageCircle as MessageCircle, IconMoon as Moon, IconLayoutDashboard as LayoutDashboard, IconBuilding as Building2, IconFileCheck as FileCheckCorner, IconCashBanknote as Banknote, IconMessages as MessagesSquare, IconUsers as Users, IconUser as UserRound, IconShieldCheck as ShieldCheck, IconHistory as History, IconChartBar as ChartBar, IconMenu2 as Menu, IconBell as Bell } from "@tabler/icons-react";

import { signOut } from "@/service/signOutService";
import { usePendingNavigation } from "@/hooks/use-pending-navigation";
import SidebarLinkPending from "./SidebarLinkPending";
import { NOTIFICATIONS_QUERY_VALUE } from "@/app/components/notifications/NotificationsOverlay";
import UserAvatar from "@/app/components/profile/UserAvatar";
import { useNotifications } from "@/hooks/use-notifications";
import { getUnreadSidebarActivity, type SidebarActivityKey } from "@/lib/sidebar-notification-activity";
import ToggleSwitch from "@/app/components/settings/ToggleSwitch";
import { SETTINGS_QUERY_VALUE } from "@/app/components/settings/SettingsOverlay";

const ICON_MAP: Record<string, LucideIcon> = {
  Search,
  House,
  FileText,
  Heart,
  Wrench,
  MessageCircle,
  LayoutDashboard,
  Building2,
  FileCheckCorner,
  Banknote,
  MessagesSquare,
  Users,
  ShieldCheck,
  History,
  ChartBar,
};

const ADMIN_ICON_MAP: Record<string, TablerIcon> = {
  LayoutDashboard: IconLayoutDashboard,
  Users: IconUsers,
  User: IconUser,
  Building: IconBuilding,
  Building2: IconBuilding,
  ShieldCheck: IconShieldCheck,
  History: IconHistory,
  ChartBar: IconChartBar,
  Flag: IconFlag,
  Search: IconSearch,
  Home: IconHome,
  FileText: IconFileText,
  FileCheck: IconFileCheck,
  Heart: IconHeart,
  Tool: IconTool,
  MessageCircle: IconMessageCircle,
  Messages: IconMessages,
  CashBanknote: IconCashBanknote,
};

const SIDEBAR_STORAGE_KEYS = {
  admin: "admin-sidebar-collapsed",
  tenant: "tenant-sidebar-collapsed",
  landlord: "landlord-sidebar-collapsed",
} as const;

export type SidebarPortal = keyof typeof SIDEBAR_STORAGE_KEYS;

function resolveStorageKey(
  storageKey: string | undefined,
  activePortal: SidebarPortal | undefined,
): string {
  if (storageKey) return storageKey;
  if (activePortal && activePortal in SIDEBAR_STORAGE_KEYS) {
    return SIDEBAR_STORAGE_KEYS[activePortal];
  }
  return SIDEBAR_STORAGE_KEYS.admin;
}

function changeEventFor(storageKey: string) {
  return `${storageKey}-change`;
}

function subscribeToSidebarState(storageKey: string, onChange: () => void) {
  const changeEvent = changeEventFor(storageKey);
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(changeEvent, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(changeEvent, onChange);
  };
}

function getStoredSidebarState(storageKey: string) {
  try {
    return window.localStorage.getItem(storageKey) === "true";
  } catch {
    return false;
  }
}

function toggleStoredSidebarState(storageKey: string, collapsed: boolean) {
  try {
    window.localStorage.setItem(storageKey, String(!collapsed));
    window.dispatchEvent(new Event(changeEventFor(storageKey)));
  } catch {
    // Storage may be unavailable; keep the expanded sidebar usable.
  }
}

function getInitialSidebarState() {
  return false;
}

/**
 * Closes an overlay when the window crosses `query` in the direction that
 * hides its anchor.
 *
 * The account dropdown lives in a floating layer, so hiding the sidebar
 * (`hidden md:flex`) does not hide an already-open menu — it stays
 * anchored to nothing and floats over the page. Closing on the crossing
 * keeps it tied to a visible anchor in both directions.
 */
function useCloseOverlayAt(query: string, shouldClose: boolean, close: () => void) {
  useEffect(() => {
    const media = window.matchMedia(query);
    const handleChange = () => {
      if (shouldClose) close();
    };
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [query, shouldClose, close]);
}

// Client-mount gate for theme-dependent UI (avoids hydration mismatch).
// Mirrors the sidebar's collapsed-state store pattern so no effect is needed.
function subscribeThemeMounted() {
  return () => {};
}

type NavItem = {
  href: string;
  label: string;
  icon: string;
  activityKey?: SidebarActivityKey;
  /** Warm this route on hover/focus and when the mobile menu opens. */
  prefetchOnIntent?: boolean;
};

function UnreadActivityDot({ active = false, collapsed = false }: { active?: boolean; collapsed?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute size-2 rounded-full ${collapsed ? "right-0.5 top-0.5" : "right-3 top-1/2 -translate-y-1/2"} ${active ? "bg-sidebar-primary-foreground" : "bg-primary"}`}
    />
  );
}

export type SwitchTarget = { href: string; label: string };

/**
 * One-click portal switch entries, offered only for portals whose role the
 * account actually holds. Navigating cross-portal is the context switch —
 * no re-authentication and no new role grant, since the held role already
 * satisfies the route guards. Dual-role tenant/landlord accounts get one
 * entry for the other portal; admins (who may hold either consumer role,
 * both, or neither) get an entry per held consumer portal, and any consumer
 * portal gets a way back to /admin.
 *
 * Shared by the desktop sidebar dropdown and the mobile FAB menu so the two
 * cannot drift apart.
 */
export function getSwitchTargets(
  activePortal: "tenant" | "landlord" | "admin" | undefined,
  userRoles: string[],
): SwitchTarget[] {
  if (!activePortal) return [];

  if (activePortal === "admin") {
    return [
      userRoles.includes("landlord")
        ? { href: "/landlord/dashboard", label: "View as Landlord" }
        : null,
      userRoles.includes("tenant")
        ? { href: "/tenant/my-rental", label: "View as Tenant" }
        : null,
    ].filter((item): item is SwitchTarget => item !== null);
  }

  return [
    userRoles.includes("admin")
      ? { href: "/admin/dashboard", label: "Back to Admin view" }
      : null,
    activePortal === "tenant" && userRoles.includes("landlord")
      ? { href: "/landlord/dashboard", label: "Switch to Landlord view" }
      : null,
    activePortal === "landlord" && userRoles.includes("tenant")
      ? { href: "/tenant/my-rental", label: "Switch to Tenant view" }
      : null,
  ].filter((item): item is SwitchTarget => item !== null);
}

type AppSidebarProps = {
  navItems: NavItem[];
  userName: string;
  userRole: string;
  userAvatarUrl?: string | null;
  showAccountLinks?: boolean;
  // Multi-role switching: all roles the account holds + which portal
  // this sidebar belongs to. Switch entries only appear for portals whose
  // role the account actually holds — the held role is what lets the
  // middleware admit that portal, so no extra grant is needed.
  userRoles?: string[];
  activePortal?: "tenant" | "landlord" | "admin";
  profileHref?: string;
  settingsHref?: string;
  settingsQueryParam?: string;
  iconSet?: "lucide" | "tabler";
  collapsible?: boolean;
  storageKey?: string;
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function getInitials(value: string) {
  const normalized = value.trim();
  if (!normalized) return "U";
  const parts = normalized.split(/\s+/).filter(Boolean);
  return (
    parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "U"
  );
}

export function AppSidebar({
  navItems,
  userName,
  userRole,
  userAvatarUrl = null,
  showAccountLinks = true,
  profileHref: accountProfileHref,
  settingsHref,
  settingsQueryParam,
  iconSet = "lucide",
  collapsible = false,
  userRoles = [],
  activePortal,
  storageKey,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { pendingHref, navigate } = usePendingNavigation();
  const { notifications } = useNotifications(activePortal ?? null);
  const activity = useMemo(
    () => getUnreadSidebarActivity(notifications, activePortal ?? null),
    [notifications, activePortal],
  );
  const resolvedStorageKey = resolveStorageKey(storageKey, activePortal);
  const subscribe = useCallback(
    (onChange: () => void) => subscribeToSidebarState(resolvedStorageKey, onChange),
    [resolvedStorageKey],
  );
  const getSnapshot = useCallback(
    () => getStoredSidebarState(resolvedStorageKey),
    [resolvedStorageKey],
  );
  const { resolvedTheme, setTheme } = useTheme();
  const themeMounted = useSyncExternalStore(
    subscribeThemeMounted,
    () => true,
    () => false,
  );

  const isDark = themeMounted && resolvedTheme === "dark";
  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };
  const savedCollapsed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getInitialSidebarState,
  );
  const collapsed = collapsible && savedCollapsed;
  const toggleCollapsed = useCallback(
    () => toggleStoredSidebarState(resolvedStorageKey, collapsed),
    [resolvedStorageKey, collapsed],
  );
  const sidebarLabel =
    activePortal === "tenant"
      ? "Tenant sidebar"
      : activePortal === "landlord"
        ? "Landlord sidebar"
        : collapsible
          ? "Admin sidebar"
          : "Portal sidebar";

  // The sidebar is `hidden md:flex`, so an open account menu would be
  // orphaned over the page once the window drops below md.
  const [isAccountMenuOpen, setAccountMenuOpen] = useState(false);
  const closeAccountMenu = useCallback(() => setAccountMenuOpen(false), []);
  useCloseOverlayAt("(max-width: 767.98px)", true, closeAccountMenu);

  const displayName = userName?.trim() || "User";
  const roleLabel = userRole?.trim() || "";
  const profileHref = accountProfileHref ?? (roleLabel.toLowerCase() === "landlord"
    ? "/landlord/profile"
    : "/tenant/profile");

  const switchTargets = getSwitchTargets(activePortal, userRoles);

  // Prefetch the profile route while the account menu is open so tapping
  // Profile paints immediately instead of fetching on demand.
  const handleAccountMenuOpenChange = useCallback(
    (value: boolean) => {
      setAccountMenuOpen(value);
      if (value) router.prefetch(profileHref);
    },
    [router, profileHref],
  );

  return (
    <aside
      aria-label={sidebarLabel}
      className={`hidden md:flex shrink-0 flex-col bg-sidebar border-r border-sidebar-border min-h-screen sticky top-0 h-screen shadow-sm text-sidebar-foreground ${collapsible ? "font-nunito" : ""} ${collapsed ? "w-16" : "w-64"}`}
    >
      {/* In the collapsed rail, the logo doubles as the expand control. */}
      <div
        className={`flex border-b border-sidebar-border bg-sidebar ${collapsed ? "justify-center px-2 py-3" : "items-center justify-between gap-2 px-5 py-5"}`}
      >
        {collapsed ? (
          <button
            type="button"
            aria-label="Expand sidebar"
            aria-expanded={false}
            onClick={toggleCollapsed}
            className="group relative flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <Image
              src={isDark ? "/logo/logo.svg" : "/logo/logo-white.svg"}
              alt=""
              width={32}
              height={32}
              className="size-8 rounded-lg object-contain group-hover:opacity-0 group-focus-visible:opacity-0"
              priority
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-sidebar-accent text-sidebar-foreground opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              <IconLayoutSidebarLeftExpand
                size={28}
                className="size-6 shrink-0"
              />
            </span>
          </button>
        ) : (
          <Link
            href={navItems[0]?.href ?? "/"}
            className="flex shrink-0 items-center"
          >
            <Image
              src="/logo/logo-name-transparent.svg"
              alt="APT Logo"
              width={118}
              height={42}
              className="object-contain"
              priority
            />
          </Link>
        )}
        {collapsible && !collapsed ? (
          <button
            type="button"
            aria-label="Collapse sidebar"
            aria-expanded={true}
            className="group flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-sidebar-foreground/70 hover:bg-primary/10 hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            onClick={toggleCollapsed}
          >
            <IconLayoutSidebarLeftCollapse
              size={28}
              className="size-6 shrink-0 group-hover:text-primary"
              aria-hidden="true"
            />
          </button>
        ) : null}
      </div>

      {/* Nav — good UX: clear hierarchy, 44px touch target, primary active */}
      <nav
        aria-label="Portal pages"
        className={`flex flex-1 flex-col overflow-y-auto ${collapsed ? "gap-1 px-2 py-2" : "gap-1.5 px-3 py-4"}`}
      >
        {navItems.map(({ label, href, icon, activityKey, prefetchOnIntent }) => {
          const active = isActive(pathname, href);
          const hasActivity = !!activityKey && activity.has(activityKey);
          const Icon =
            iconSet === "tabler"
              ? (ADMIN_ICON_MAP[icon] ?? IconSearch)
              : (ICON_MAP[icon] ?? Search);
          return (
            <Link
              href={href}
              key={href}
              onMouseEnter={prefetchOnIntent ? () => router.prefetch(href) : undefined}
              onFocus={prefetchOnIntent ? () => router.prefetch(href) : undefined}
              aria-current={active ? "page" : undefined}
              aria-label={hasActivity ? `${label}, Unread activity` : collapsed ? label : undefined}
              title={collapsed ? `${label}${hasActivity ? ", Unread activity" : ""}` : undefined}
              className={`group relative flex min-h-11 w-full items-center rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring ${collapsed ? "justify-center" : "gap-3 py-2.5 pl-3 pr-7"} ${
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-primary hover:bg-primary/10"
              }`}
            >
              <Icon
                size={collapsed ? 22 : 20}
                aria-hidden="true"
                className={`shrink-0 ${active ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60 group-hover:text-primary"}`}
              />
              {!collapsed ? <span>{label}</span> : null}
              {hasActivity ? <UnreadActivityDot active={active} collapsed={collapsed} /> : null}
              <SidebarLinkPending label={label} />
            </Link>
          );
        })}
      </nav>

      {/* Footer — theme-aware */}
      <div
        className={`border-t border-sidebar-border bg-sidebar ${collapsed ? "p-2" : "p-3"}`}
      >
        <Dropdown isOpen={isAccountMenuOpen} onOpenChange={handleAccountMenuOpenChange}>
          <Button
            variant="ghost"
            aria-busy={pendingHref !== null || undefined}
            aria-label={collapsed ? `${displayName} account menu` : undefined}
            className={`relative w-full group flex items-center h-auto hover:bg-primary/10 text-sidebar-foreground rounded-xl hover:text-sidebar-accent-foreground ${collapsed ? "justify-center p-2" : "gap-3 px-2.5 py-2.5 justify-start"}`}
          >
            <UserAvatar
              src={userAvatarUrl}
              initials={getInitials(displayName)}
              alt={`${displayName}'s profile photo`}
              size="sm"
              className="shrink-0 bg-primary text-white"
              fallbackClassName="bg-primary text-white"
            />
            {!collapsed ? (
              <span className="flex flex-col text-left flex-1 min-w-0">
                <span className="text-sm font-medium leading-none truncate text-sidebar-foreground">
                  {displayName}
                </span>
                {roleLabel ? (
                  <span className="text-xs text-sidebar-foreground/60 truncate">
                    {roleLabel}
                  </span>
                ) : null}
              </span>
            ) : null}
            {pendingHref ? (
              <span className={collapsed ? "pointer-events-none absolute bottom-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-sidebar" : "ml-auto shrink-0"}>
                <Spinner size="sm" aria-label="Opening page" />
              </span>
            ) : !collapsed &&
              (iconSet === "tabler" ? (
                <IconSelector
                  size={14}
                  className="ml-auto text-sidebar-foreground/40 shrink-0 group-hover:text-primary"
                />
              ) : (
                <ChevronsUpDown
                  size={14}
                  className="ml-auto text-sidebar-foreground/40 shrink-0 group-hover:text-primary"
                />
              ))}
          </Button>
          <Dropdown.Popover
            placement="top"
            className={collapsible ? "font-nunito" : undefined}
          >
            <Dropdown.Menu
              onAction={(key) => {
                if (key === "profile") navigate(profileHref);
                if (key === "settings") {
                  if (settingsQueryParam) {
                    const url = new URL(window.location.href);
                    url.searchParams.set("settings", settingsQueryParam);
                    window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
                  } else {
                    navigate(settingsHref ?? "/settings");
                  }
                }
                const target = switchTargets.find((item) => `switch:${item.href}` === key);
                if (target) navigate(target.href);
                if (key === "theme") toggleTheme();
                if (key === "logout") signOut();
              }}
            >
                {showAccountLinks ? (<>
                <Dropdown.Item id="profile" textValue="Profile">
                  <Label className="flex items-center gap-2">
                    {iconSet === "tabler" ? (
                      <IconUser size={18} aria-hidden="true" />
                    ) : (
                      <UserRound size={18} aria-hidden="true" />
                    )}
                    Profile
                  </Label>
                </Dropdown.Item>
                {/* Every portal with at least one other authorized
                  destination gets the same "Switch Portal" hover submenu
                  (keyboard/touch supported via RAC). The targets already
                  exclude the current portal and only include held roles
                  (see getSwitchTargets), so dual-role accounts never see
                  an Admin entry and single-portal accounts see nothing. */}
                {switchTargets.length > 0 ? (
                  <Dropdown.SubmenuTrigger>
                    <Dropdown.Item id="switch-portal" textValue="Switch Portal" className="group">
                      <Label className="flex w-full items-center gap-2">
                        {iconSet === "tabler" ? (
                          <IconArrowsExchange size={18} className="shrink-0 text-primary" aria-hidden="true" />
                        ) : (
                          <ArrowLeftRight size={18} className="shrink-0 text-primary" aria-hidden="true" />
                        )}
                        Switch Portal
                        <span className="ml-auto flex shrink-0 items-center">
                          <Dropdown.SubmenuIndicator className="text-grey-500! group-hover:text-primary! group-data-[focused=true]:text-primary! group-data-[open=true]:text-primary!" />
                        </span>
                      </Label>
                    </Dropdown.Item>
                    {/* `end` docks the submenu beside the dropdown; RAC flips
                      it automatically when there is no room on the right.
                      Submenu item actions belong to this nested menu, so it
                      carries its own onAction with the same guard logic. */}
                    <Dropdown.Popover placement="end">
                      <Dropdown.Menu
                        aria-label="Switch portal"
                        onAction={(key) => {
                          const target = switchTargets.find((item) => `switch:${item.href}` === key);
                          if (target) navigate(target.href);
                        }}
                      >
                        {switchTargets.map((target) => {
                          const portalActive = isActive(pathname, target.href);
                          // Portal-specific identity for the submenu only:
                          // landlord gets the estate glyph, tenant the user
                          // glyph. Anything else falls back to the shared
                          // switch glyph and the guard-provided label, so an
                          // unexpected target still navigates correctly.
                          const isLandlordTarget = target.href.startsWith("/landlord");
                          const isTenantTarget = target.href.startsWith("/tenant");
                          const isAdminTarget = target.href.startsWith("/admin");
                          const submenuLabel = isLandlordTarget
                            ? "Switch to Landlord"
                            : isTenantTarget
                              ? "Switch to Tenant"
                              : isAdminTarget
                                ? "Switch to Admin"
                                : target.label;
                          return (
                            <Dropdown.Item
                              key={target.href}
                              id={`switch:${target.href}`}
                              textValue={submenuLabel}
                              aria-current={portalActive ? "page" : undefined}
                              className={portalActive ? "bg-primary/10 text-primary" : undefined}
                            >
                              <Label className={`flex items-center gap-2 ${portalActive ? "font-semibold text-primary" : ""}`}>
                                {iconSet === "tabler" ? (
                                  isLandlordTarget ? (
                                    <IconBuildingEstate size={18} aria-hidden="true" />
                                  ) : isTenantTarget ? (
                                    <IconUser size={18} aria-hidden="true" />
                                  ) : isAdminTarget ? (
                                    <IconShieldCheck size={18} aria-hidden="true" />
                                  ) : (
                                    <IconArrowsExchange size={18} aria-hidden="true" />
                                  )
                                ) : isLandlordTarget ? (
                                  <Building2 size={18} aria-hidden="true" />
                                ) : isTenantTarget ? (
                                  <UserRound size={18} aria-hidden="true" />
                                ) : isAdminTarget ? (
                                  <ShieldCheck size={18} aria-hidden="true" />
                                ) : (
                                  <ArrowLeftRight size={18} aria-hidden="true" />
                                )}
                                {submenuLabel}
                              </Label>
                            </Dropdown.Item>
                          );
                        })}
                      </Dropdown.Menu>
                    </Dropdown.Popover>
                  </Dropdown.SubmenuTrigger>
                ) : (
                  switchTargets.map((target) => (
                  <Dropdown.Item
                    key={target.href}
                    id={`switch:${target.href}`}
                    textValue={target.label}
                  >
                    <Label className="flex items-center gap-2">
                      {iconSet === "tabler" ? (
                        <IconArrowsExchange size={18} aria-hidden="true" />
                      ) : (
                        <ArrowLeftRight size={18} aria-hidden="true" />
                      )}
                      {target.label}
                    </Label>
                  </Dropdown.Item>
                  ))
                )}
                <Dropdown.Item id="theme" textValue="Dark Mode">
                  <Label className="flex w-full items-center gap-2">
                    {iconSet === "tabler" ? (
                      isDark ? (
                        <IconMoon size={18} aria-hidden="true" />
                      ) : (
                        <IconSun size={18} aria-hidden="true" />
                      )
                    ) : isDark ? (
                      <Moon size={18} aria-hidden="true" />
                    ) : (
                      <Sun size={18} aria-hidden="true" />
                    )}
                    Dark Mode
                    <span className="ml-auto pointer-events-none flex items-center">
                      <ToggleSwitch
                        isSelected={isDark}
                        onValueChange={toggleTheme}
                        disabled={!themeMounted}
                        aria-label="Toggle dark mode"
                      />
                    </span>
                  </Label>
                </Dropdown.Item>
                {settingsHref || settingsQueryParam || !accountProfileHref ? (
                  <Dropdown.Item id="settings" textValue="Settings">
                    <Label className="flex items-center gap-2">
                      {iconSet === "tabler" ? (
                        <IconSettings size={18} aria-hidden="true" />
                      ) : (
                        <Settings size={18} aria-hidden="true" />
                      )}
                      Settings
                    </Label>
                  </Dropdown.Item>
                ) : null}
              </>) : null}
              <Dropdown.Item id="logout" variant="danger" textValue="Log Out">
                <Label className="flex items-center gap-2">
                  {iconSet === "tabler" ? (
                    <IconLogout size={18} aria-hidden="true" />
                  ) : (
                    <LogOut size={18} aria-hidden="true" />
                  )}{" "}
                  Log Out
                </Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
      {pendingHref ? <span role="status" className="sr-only">Opening {pendingHref.split("/").at(-1)}…</span> : null}
    </aside>
  );
}

type MobileSidebarNavigationProps = {
  navItems: NavItem[];
  iconSet?: "lucide" | "tabler";
  navLabel?: string;
  menuLabel?: string;
  buttonLabel?: string;
  // Same multi-role switching inputs as AppSidebar, so this menu offers the
  // same entries instead of being role-blind on phones.
  userRoles?: string[];
  activePortal?: "tenant" | "landlord" | "admin";
  // Rendered in the account group (with Settings and Dark Mode), not the page list.
  profileHref?: string;
};

// `useSearchParams` (for the Settings row) opts a subtree into client-side
// rendering, so it must sit behind a Suspense boundary or prerendering any
// portal page fails with "useSearchParams() should be wrapped in a suspense
// boundary". Callers render this wrapper; the work happens in the inner
// component.
function MobileNotificationsItem({
  unreadCount,
  iconSet,
}: {
  unreadCount: number;
  iconSet?: "lucide" | "tabler";
}) {
  return (
    <Dropdown.Item id="notifications" textValue="Notifications">
      <Label className="flex w-full items-center gap-2">
        {iconSet === "tabler" ? (
          <IconBell size={18} aria-hidden="true" />
        ) : (
          <Bell size={18} aria-hidden="true" />
        )}
        Notifications
        {unreadCount > 0 && (
          <span className="ml-auto flex min-h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Label>
    </Dropdown.Item>
  );
}
function MobileSidebarMenu({
  navItems,
  iconSet,
  navLabel,
  menuLabel,
  buttonLabel,
  userRoles,
  activePortal,
  profileHref,
}: MobileSidebarNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { pendingHref, navigate } = usePendingNavigation();
  const { notifications, unreadCount } = useNotifications(activePortal ?? null);
  const activity = useMemo(
    () => getUnreadSidebarActivity(notifications, activePortal ?? null),
    [notifications, activePortal],
  );
  const searchParams = useSearchParams();
  const { resolvedTheme, setTheme } = useTheme();

  // Mirrors the sidebar footer so the theme icon matches in both menus.
  const themeMounted = useSyncExternalStore(
    subscribeThemeMounted,
    () => true,
    () => false,
  );
  const isDark = themeMounted && resolvedTheme === "dark";
  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  // This FAB is `md:hidden`, so an open menu would be orphaned once the
  // window reaches md and the sidebar takes over.
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  useCloseOverlayAt("(min-width: 768px)", true, closeMobileMenu);

  // Unlike desktop Links, menu actions don't automatically prefetch routes.
  const handleMobileMenuOpenChange = useCallback(
    (value: boolean) => {
      setMobileMenuOpen(value);
      if (value && profileHref) router.prefetch(profileHref);
      if (value) {
        navItems.forEach(({ href, prefetchOnIntent }) => {
          if (prefetchOnIntent) router.prefetch(href);
        });
      }
    },
    [router, profileHref, navItems],
  );
  useCloseOverlayAt("(min-width: 768px)", true, closeMobileMenu);

  // Settings and theme were only reachable from the desktop sidebar, so
  // they are offered here too — this menu is the sole navigation on phones.
  const openSettings = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("settings", SETTINGS_QUERY_VALUE);
    const query = params.toString();
    window.history.pushState(null, "", `${pathname}${query ? `?${query}` : ""}`);
  };

  // Opens the notifications drawer through the shared query param (same
  // pattern as Settings); the overlay mounted by the portal layout renders it.
  const openNotifications = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("notifications", NOTIFICATIONS_QUERY_VALUE);
    const query = params.toString();
    window.history.pushState(null, "", `${pathname}${query ? `?${query}` : ""}`);
  };

  // Same helper the sidebar dropdown uses, so both menus stay in step.
  const switchTargets = getSwitchTargets(activePortal, userRoles ?? []);

  // On the tenant apartment detail page the fixed price bar docks to the
  // screen bottom, so the pill floats above it instead of overlapping it.
  const isApartmentDetail =
    activePortal === "tenant" && /^\/tenant\/browse\/[^/]+\/?$/.test(pathname);

  return (
    <nav
      aria-label={navLabel}
      className={`fixed left-4 z-40 md:hidden ${isApartmentDetail ? "bottom-24" : "bottom-4"}`}
    >
      <Dropdown isOpen={isMobileMenuOpen} onOpenChange={handleMobileMenuOpenChange}>
        <Button
          variant="primary"
          className="rounded-full shadow-sm"
          aria-label={buttonLabel}
          aria-busy={pendingHref !== null || undefined}
        >
          {pendingHref ? <Spinner size="sm" color="current" aria-hidden="true" /> : iconSet === "tabler" ? (
            <IconMenu2 size={18} aria-hidden="true" />
          ) : (
            <Menu size={18} aria-hidden="true" />
          )}{" "}
          {pendingHref ? "Opening…" : "Menu"}
        </Button>
        {pendingHref ? <span role="status" className="sr-only">Opening {pendingHref.split("/").at(-1)}…</span> : null}
        {/* Capped to the viewport so the longest portal list (admin) scrolls
            instead of running off short or landscape screens. */}
        <Dropdown.Popover
          placement="top start"
          className="max-h-[calc(100dvh-6rem)] min-w-60 overflow-y-auto font-nunito"
        >
          <Dropdown.Menu
            aria-label={menuLabel}
            onAction={(key) => {
              if (key === "settings") openSettings();
              if (key === "notifications") openNotifications();
              // The switch is pointer-events-none, so the row tap is what
              // actually toggles the theme (mirrors the sidebar footer).
              if (key === "theme") toggleTheme();
              if (key === "logout") signOut();
              const target = switchTargets.find((item) => `switch:${item.href}` === key);
              if (target) navigate(target.href);
              if (key === "profile" && profileHref) navigate(profileHref);
              const navItem = navItems.find((item) => item.href === key);
              if (navItem) navigate(navItem.href);
            }}
          >
            <Dropdown.Section aria-label={menuLabel}>
              {navItems.map(({ href, label, icon, activityKey }) => {
                const Icon =
                  iconSet === "tabler"
                    ? (ADMIN_ICON_MAP[icon] ?? IconSearch)
                    : (ICON_MAP[icon] ?? Search);
                const active = isActive(pathname, href);
                const hasActivity = !!activityKey && activity.has(activityKey);
                return (
                  <Dropdown.Item
                    key={href}
                    id={href}
                    textValue={label}
                    aria-label={hasActivity ? `${label}, Unread activity` : undefined}
                    aria-current={active ? "page" : undefined}
                    className={active ? "bg-primary/10 text-primary" : undefined}
                  >
                    <Label
                      className={`relative flex w-full items-center gap-2 pr-7 ${active ? "font-semibold text-primary" : ""}`}
                    >
                      <Icon size={18} aria-hidden="true" />
                      {label}
                      {hasActivity ? <UnreadActivityDot /> : null}
                    </Label>
                  </Dropdown.Item>
                );
              })}
            </Dropdown.Section>

            <Separator />

            <Dropdown.Section aria-label="Account">
              {profileHref ? (
                <Dropdown.Item
                  id="profile"
                  textValue="Profile"
                  aria-current={isActive(pathname, profileHref) ? "page" : undefined}
                  className={isActive(pathname, profileHref) ? "bg-primary/10 text-primary" : undefined}
                >
                  <Label
                    className={`flex items-center gap-2 ${isActive(pathname, profileHref) ? "font-semibold text-primary" : ""}`}
                  >
                    {iconSet === "tabler" ? (
                      <IconUser size={18} aria-hidden="true" />
                    ) : (
                      <UserRound size={18} aria-hidden="true" />
                    )}
                    Profile
                  </Label>
                </Dropdown.Item>
              ) : null}

              {switchTargets.map((target) => (
                <Dropdown.Item
                  key={target.href}
                  id={`switch:${target.href}`}
                  textValue={target.label}
                >
                  <Label className="flex items-center gap-2">
                    {iconSet === "tabler" ? (
                      <IconArrowsExchange size={18} aria-hidden="true" />
                    ) : (
                      <ArrowLeftRight size={18} aria-hidden="true" />
                    )}
                    {target.label}
                  </Label>
                </Dropdown.Item>
              ))}

              <Dropdown.Item id="settings" textValue="Settings">
                <Label className="flex items-center gap-2">
                  {iconSet === "tabler" ? (
                    <IconSettings size={18} aria-hidden="true" />
                  ) : (
                    <Settings size={18} aria-hidden="true" />
                  )}
                  Settings
                </Label>
              </Dropdown.Item>

              {(activePortal === "tenant" ||
                activePortal === "landlord" ||
                activePortal === "admin") && (
                <MobileNotificationsItem unreadCount={unreadCount} iconSet={iconSet} />
              )}

              <Dropdown.Item id="theme" textValue="Dark Mode">
                <Label className="flex w-full items-center gap-2">
                  {iconSet === "tabler" ? (
                    isDark ? (
                      <IconMoon size={18} aria-hidden="true" />
                    ) : (
                      <IconSun size={18} aria-hidden="true" />
                    )
                  ) : isDark ? (
                    <Moon size={18} aria-hidden="true" />
                  ) : (
                    <Sun size={18} aria-hidden="true" />
                  )}
                  Dark Mode
                  <span className="ml-auto pointer-events-none flex items-center">
                    <ToggleSwitch
                      isSelected={isDark}
                      onValueChange={toggleTheme}
                      disabled={!themeMounted}
                      aria-label="Toggle dark mode"
                    />
                  </span>
                </Label>
              </Dropdown.Item>
            </Dropdown.Section>

            <Separator />

            <Dropdown.Item id="logout" variant="danger" textValue="Log Out">
              <Label className="flex items-center gap-2">
                {iconSet === "tabler" ? (
                  <IconLogout size={18} aria-hidden="true" />
                ) : (
                  <LogOut size={18} aria-hidden="true" />
                )}
                Log Out
              </Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </nav>
  );
}

export function MobileSidebarNavigation(props: MobileSidebarNavigationProps) {
  return (
    <Suspense fallback={null}>
      <MobileSidebarMenu {...props} />
    </Suspense>
  );
}

export default AppSidebar;

