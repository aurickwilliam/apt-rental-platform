"use client";

import { Fragment, Suspense, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
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
  IconX,
  type Icon as TablerIcon,
} from "@tabler/icons-react";

import { Button, Drawer, Dropdown, Label, Separator, Spinner, useOverlayState } from "@heroui/react";
import { IconArrowsExchange as ArrowLeftRight, IconLogout as LogOut, IconSelector as ChevronsUpDown, IconSearch as Search, IconSettings as Settings, IconSun as Sun, IconHome as House, IconFileText as FileText, IconHeart as Heart, IconTool as Wrench, IconMessageCircle as MessageCircle, IconMoon as Moon, IconLayoutDashboard as LayoutDashboard, IconBuilding as Building2, IconFileCheck as FileCheckCorner, IconCashBanknote as Banknote, IconMessages as MessagesSquare, IconUsers as Users, IconUser as UserRound, IconShieldCheck as ShieldCheck, IconHistory as History, IconChartBar as ChartBar } from "@tabler/icons-react";

import { signOut } from "@/service/signOutService";
import { usePendingNavigation } from "@/hooks/use-pending-navigation";
import SidebarLinkPending from "./SidebarLinkPending";
import SidebarNotificationsItem from "./SidebarNotificationsItem";
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
  /** Name of the group this item belongs to; consecutive items sharing it sit together under a separator. */
  section?: string;
};

type NavGroup = { section?: string; items: NavItem[] };

/** Splits the flat nav list into consecutive same-`section` groups (one unlabeled group when none is set). */
function groupNavItems(navItems: NavItem[]): NavGroup[] {
  const groups: NavGroup[] = [];
  for (const item of navItems) {
    const last = groups[groups.length - 1];
    if (last && last.section === item.section) last.items.push(item);
    else groups.push({ section: item.section, items: [item] });
  }
  return groups;
}

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
 * Shared by the desktop sidebar dropdown and the mobile drawer so the two
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
  favoritesHref?: string;
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
  favoritesHref,
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
  const navGroups = useMemo(() => groupNavItems(navItems), [navItems]);
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

  // Warm account destinations when the menu opens.
  const handleAccountMenuOpenChange = useCallback(
    (value: boolean) => {
      setAccountMenuOpen(value);
      if (value) router.prefetch(profileHref);
      if (value && favoritesHref) router.prefetch(favoritesHref);
    },
    [router, profileHref, favoritesHref],
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
        {navGroups.map((group, groupIndex) => (
          <div
            key={group.section ?? "pages"}
            role={group.section ? "group" : undefined}
            aria-label={group.section}
            className={`flex flex-col ${collapsed ? "gap-1" : "gap-1.5"}`}
          >
            {groupIndex > 0 ? <Separator className={collapsed ? "my-1" : "my-1.5"} /> : null}
            {group.items.map(({ label, href, icon, activityKey, prefetchOnIntent }) => {
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
          </div>
        ))}
        <SidebarNotificationsItem activePortal={activePortal} collapsed={collapsed} />
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
                if (key === "profile") router.push(profileHref);
                if (key === "favorites" && favoritesHref) router.push(favoritesHref);
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
                {favoritesHref ? (
                  <Dropdown.Item
                    id="favorites"
                    textValue="Favorites"
                    aria-current={isActive(pathname, favoritesHref) ? "page" : undefined}
                    className={isActive(pathname, favoritesHref) ? "bg-primary/10 text-primary" : undefined}
                  >
                    <Label className={`flex items-center gap-2 ${isActive(pathname, favoritesHref) ? "font-semibold text-primary" : ""}`}>
                      <IconHeart size={18} aria-hidden="true" />
                      Favorites
                    </Label>
                  </Dropdown.Item>
                ) : null}
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
  favoritesHref?: string;
};

const DRAWER_ROW_CLASS =
  "flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left font-nunito text-[15px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary";

function drawerRowClass(active: boolean) {
  return `${DRAWER_ROW_CLASS} ${
    active
      ? "bg-primary/10 font-semibold text-primary"
      : "text-foreground hover:bg-primary/5 hover:text-primary"
  }`;
}

// Below `md` the sidebar is gone: a sticky top bar holds the hamburger, and
// the whole portal navigation (pages, account, theme, log out) lives in a
// left drawer. Rendered inside the portal's content column, before `main`.
function MobileSidebarMenu({
  navItems,
  iconSet,
  navLabel,
  menuLabel,
  buttonLabel,
  userRoles,
  activePortal,
  profileHref,
  favoritesHref,
}: MobileSidebarNavigationProps) {
  const pathname = usePathname();
  const navGroups = useMemo(() => groupNavItems(navItems), [navItems]);
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

  // The top bar is `md:hidden`, so an open drawer would be orphaned once the
  // window reaches md and the sidebar takes over.
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  useCloseOverlayAt("(min-width: 768px)", true, closeMobileMenu);

  // Rows are buttons, not Links, so routes are warmed explicitly when the
  // drawer opens: the account pages and only the items that opted in.
  const handleMobileMenuOpenChange = useCallback(
    (value: boolean) => {
      setMobileMenuOpen(value);
      if (value && profileHref) router.prefetch(profileHref);
      if (value && favoritesHref) router.prefetch(favoritesHref);
      if (value) {
        navItems.forEach(({ href, prefetchOnIntent }) => {
          if (prefetchOnIntent) router.prefetch(href);
        });
      }
    },
    [router, profileHref, favoritesHref, navItems],
  );
  const drawerState = useOverlayState({
    isOpen: isMobileMenuOpen,
    onOpenChange: handleMobileMenuOpenChange,
  });

  // Settings and notifications open through shared query params (the overlays
  // mounted by the portal layout render them), so the drawer closes first.
  const openOverlay = (param: string, value: string) => {
    closeMobileMenu();
    const params = new URLSearchParams(searchParams.toString());
    params.set(param, value);
    const query = params.toString();
    window.history.pushState(null, "", `${pathname}${query ? `?${query}` : ""}`);
  };

  // Same helper the sidebar dropdown uses, so both menus stay in step.
  const switchTargets = getSwitchTargets(activePortal, userRoles ?? []);

  // Closes the drawer and navigates inside a transition, so the top bar can
  // show pending feedback while the route loads.
  const go = (href: string) => {
    closeMobileMenu();
    navigate(href);
  };

  const iconFor = (icon: string) =>
    iconSet === "tabler" ? (ADMIN_ICON_MAP[icon] ?? IconSearch) : (ICON_MAP[icon] ?? Search);
  const profileActive = profileHref ? isActive(pathname, profileHref) : false;
  const favoritesActive = favoritesHref ? isActive(pathname, favoritesHref) : false;

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b border-divider bg-background/70 px-3 backdrop-blur-md backdrop-saturate-150 md:hidden">
        <Button
          isIconOnly
          variant="ghost"
          aria-label={buttonLabel}
          aria-haspopup="dialog"
          aria-expanded={isMobileMenuOpen}
          aria-busy={pendingHref !== null || undefined}
          onPress={() => handleMobileMenuOpenChange(true)}
        >
          {pendingHref ? (
            <>
              <Spinner size="sm" color="current" aria-hidden="true" />
              <span className="sr-only">Opening…</span>
            </>
          ) : (
            <IconMenu2 size={22} aria-hidden="true" />
          )}
        </Button>
        {pendingHref ? (
          <span role="status" className="sr-only">
            Opening {pendingHref.split("/").at(-1)}…
          </span>
        ) : null}
        <Link href={navItems[0]?.href ?? "/"} className="flex shrink-0 items-center">
          <Image
            src="/logo/logo-name-transparent.svg"
            alt="APT Logo"
            width={90}
            height={32}
            className="h-8 w-auto object-contain"
            priority
          />
        </Link>
      </header>

      <Drawer.Root state={drawerState}>
        <Drawer.Backdrop>
          <Drawer.Content placement="left">
            <Drawer.Dialog
              aria-label={menuLabel}
              className="flex h-full w-[calc(100vw-3rem)] max-w-xs flex-col rounded-r-3xl p-0 font-nunito"
            >
              <div className="flex items-center justify-between gap-2 border-b border-divider px-4 py-3">
                <Link
                  href={navItems[0]?.href ?? "/"}
                  onClick={closeMobileMenu}
                  className="flex shrink-0 items-center"
                >
                  <Image
                    src="/logo/logo-name-transparent.svg"
                    alt="APT Logo"
                    width={104}
                    height={37}
                    className="h-9 w-auto object-contain"
                  />
                </Link>
                <Button
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  onPress={closeMobileMenu}
                  aria-label="Close navigation"
                >
                  <IconX size={18} aria-hidden="true" />
                </Button>
              </div>

              <nav
                aria-label={navLabel}
                className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-3"
              >
                {navGroups.map((group, groupIndex) => (
                  <div
                    key={group.section ?? "pages"}
                    role={group.section ? "group" : undefined}
                    aria-label={group.section}
                    className="flex flex-col gap-1"
                  >
                    {groupIndex > 0 ? <Separator className="my-1.5" /> : null}
                    {group.items.map(({ href, label, icon, activityKey }) => {
                      const Icon = iconFor(icon);
                      const active = isActive(pathname, href);
                      const hasActivity = !!activityKey && activity.has(activityKey);
                      return (
                        <button
                          key={href}
                          type="button"
                          onClick={() => go(href)}
                          aria-current={active ? "page" : undefined}
                          aria-label={hasActivity ? `${label}, Unread activity` : undefined}
                          className={`relative pr-7 ${drawerRowClass(active)}`}
                        >
                          <Icon size={20} aria-hidden="true" />
                          {label}
                          {hasActivity ? <UnreadActivityDot /> : null}
                        </button>
                      );
                    })}
                  </div>
                ))}

                <Separator className="my-1.5" />

                <div role="group" aria-label="Account" className="flex flex-col gap-1">
                  {profileHref ? (
                    <button
                      type="button"
                      onClick={() => go(profileHref)}
                      aria-current={profileActive ? "page" : undefined}
                      className={drawerRowClass(profileActive)}
                    >
                      <IconUser size={20} aria-hidden="true" />
                      Profile
                    </button>
                  ) : null}
                  {favoritesHref ? (
                    <button
                      type="button"
                      onClick={() => go(favoritesHref)}
                      aria-current={favoritesActive ? "page" : undefined}
                      className={drawerRowClass(favoritesActive)}
                    >
                      <IconHeart size={20} aria-hidden="true" />
                      Favorites
                    </button>
                  ) : null}

                  {switchTargets.map((target) => (
                    <button
                      key={target.href}
                      type="button"
                      onClick={() => go(target.href)}
                      className={drawerRowClass(false)}
                    >
                      <IconArrowsExchange size={20} aria-hidden="true" />
                      {target.label}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => openOverlay("settings", SETTINGS_QUERY_VALUE)}
                    className={drawerRowClass(false)}
                  >
                    <IconSettings size={20} aria-hidden="true" />
                    Settings
                  </button>

                  {(activePortal === "tenant" ||
                    activePortal === "landlord" ||
                    activePortal === "admin") && (
                    <button
                      type="button"
                      onClick={() => openOverlay("notifications", NOTIFICATIONS_QUERY_VALUE)}
                      className={drawerRowClass(false)}
                    >
                      <IconBell size={20} aria-hidden="true" />
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-auto flex min-h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[11px] font-bold text-white">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </button>
                  )}

                  {/* The switch is pointer-events-none, so the row tap is what
                      actually toggles the theme (mirrors the sidebar footer). */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isDark}
                    disabled={!themeMounted}
                    onClick={toggleTheme}
                    className={drawerRowClass(false)}
                  >
                    {isDark ? (
                      <IconMoon size={20} aria-hidden="true" />
                    ) : (
                      <IconSun size={20} aria-hidden="true" />
                    )}
                    Dark Mode
                    <span className="pointer-events-none ml-auto flex items-center">
                      <ToggleSwitch
                        isSelected={isDark}
                        onValueChange={toggleTheme}
                        disabled={!themeMounted}
                        aria-label="Toggle dark mode"
                      />
                    </span>
                  </button>
                </div>
              </nav>

              <div className="border-t border-divider px-3 py-3">
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    signOut();
                  }}
                  className={`${DRAWER_ROW_CLASS} text-danger hover:bg-danger/10`}
                >
                  <IconLogout size={20} aria-hidden="true" />
                  Log Out
                </button>
              </div>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer.Root>
    </>
  );
}

// `useSearchParams` (for the Settings row) opts a subtree into client-side
// rendering, so it must sit behind a Suspense boundary or prerendering any
// portal page fails with "useSearchParams() should be wrapped in a suspense
// boundary". Callers render this wrapper; the work happens in the inner
// component.
export function MobileSidebarNavigation(props: MobileSidebarNavigationProps) {
  return (
    <Suspense
      fallback={<div aria-hidden="true" className="sticky top-0 z-40 h-14 shrink-0 border-b border-divider bg-background md:hidden" />}
    >
      <MobileSidebarMenu {...props} />
    </Suspense>
  );
}

export default AppSidebar;

