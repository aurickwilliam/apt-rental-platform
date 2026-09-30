"use client";

import { useCallback, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  IconArrowsExchange,
  IconBuilding,
  IconCashBanknote,
  IconChartBar,
  IconFileCheck,
  IconFileText,
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

import { Button, Dropdown, Label } from "@heroui/react";
import {
  ArrowLeftRight,
  LogOut,
  ChevronsUpDown,
  Search,
  Settings,
  Sun,
  House,
  FileText,
  Heart,
  Wrench,
  MessageCircle,
  Moon,
  LayoutDashboard,
  Building2,
  FileCheckCorner,
  Banknote,
  MessagesSquare,
  Users,
  UserRound,
  ShieldCheck,
  History,
  ChartBar,
  Menu,
} from "lucide-react";

import { useTheme } from "next-themes";
import { signOut } from "@/app/(auth)/actions/sign-out";
import UserAvatar from "@/app/components/profile/UserAvatar";
import ToggleSwitch from "@/app/(main)/settings/components/ToggleSwitch";

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

// Client-mount gate for theme-dependent UI (avoids hydration mismatch).
// Mirrors the sidebar's collapsed-state store pattern so no effect is needed.
function subscribeThemeMounted() {
  return () => {};
}

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

type AppSidebarProps = {
  navItems: NavItem[];
  userName: string;
  userRole: string;
  userAvatarUrl?: string | null;
  showAccountLinks?: boolean;
  // Multi-role switching: all roles the account holds + which portal
  // this sidebar belongs to. The switch item only appears when the
  // account holds the other portal's role.
  userRoles?: string[];
  activePortal?: "tenant" | "landlord";
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

  const displayName = userName?.trim() || "User";
  const roleLabel = userRole?.trim() || "";
  const profileHref = accountProfileHref ?? (roleLabel.toLowerCase() === "landlord"
    ? "/landlord/profile"
    : "/tenant/profile");

  // One-click role switch: offered only when the account holds the other
  // portal's role. Navigating cross-portal is the context switch — no
  // re-authentication needed.
  const switchTarget =
    activePortal === "tenant" && userRoles.includes("landlord")
      ? { href: "/landlord/dashboard", label: "Switch to Landlord view" }
      : activePortal === "landlord" && userRoles.includes("tenant")
        ? { href: "/tenant/my-rental", label: "Switch to Tenant view" }
        : null;

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
              src="/logo/logo-white.svg"
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
            className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            onClick={toggleCollapsed}
          >
            <IconLayoutSidebarLeftCollapse
              size={28}
              className="size-6 shrink-0"
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
        {navItems.map(({ label, href, icon }) => {
          const active = isActive(pathname, href);
          const Icon =
            iconSet === "tabler"
              ? (ADMIN_ICON_MAP[icon] ?? IconSearch)
              : (ICON_MAP[icon] ?? Search);
          return (
            <Link
              href={href}
              key={href}
              aria-current={active ? "page" : undefined}
              aria-label={collapsed ? label : undefined}
              title={collapsed ? label : undefined}
              className={`flex min-h-11 w-full items-center rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring ${collapsed ? "justify-center" : "gap-3 px-3 py-2.5"} ${
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
            >
              <Icon
                size={collapsed ? 22 : 20}
                aria-hidden="true"
                className={`shrink-0 ${active ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60"}`}
              />
              {!collapsed ? <span>{label}</span> : null}
            </Link>
          );
        })}
      </nav>

      {/* Footer — theme-aware */}
      <div
        className={`border-t border-sidebar-border bg-sidebar ${collapsed ? "p-2" : "p-3"}`}
      >
        <Dropdown>
          <Button
            variant="ghost"
            aria-label={collapsed ? `${displayName} account menu` : undefined}
            className={`w-full flex items-center h-auto hover:bg-sidebar-accent text-sidebar-foreground rounded-xl hover:text-sidebar-accent-foreground ${collapsed ? "justify-center p-2" : "gap-3 px-2.5 py-2.5 justify-start"}`}
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
            {!collapsed &&
              (iconSet === "tabler" ? (
                <IconSelector
                  size={14}
                  className="ml-auto text-sidebar-foreground/40 shrink-0"
                />
              ) : (
                <ChevronsUpDown
                  size={14}
                  className="ml-auto text-sidebar-foreground/40 shrink-0"
                />
              ))}
          </Button>
          <Dropdown.Popover
            placement="top"
            className={collapsible ? "font-nunito" : undefined}
          >
            <Dropdown.Menu
              onAction={(key) => {
                if (key === "profile") window.location.href = profileHref;
                if (key === "settings") {
                  if (settingsQueryParam) {
                    const url = new URL(window.location.href);
                    url.searchParams.set("settings", settingsQueryParam);
                    router.push(`${url.pathname}${url.search}${url.hash}`);
                  } else {
                    window.location.href = settingsHref ?? "/settings";
                  }
                }
                if (key === "switch-role" && switchTarget) window.location.href = switchTarget.href;
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
                {switchTarget ? (
                  <Dropdown.Item id="switch-role" textValue={switchTarget.label}>
                    <Label className="flex items-center gap-2">
                      {iconSet === "tabler" ? (
                        <IconArrowsExchange size={18} aria-hidden="true" />
                      ) : (
                        <ArrowLeftRight size={18} aria-hidden="true" />
                      )}
                      {switchTarget.label}
                    </Label>
                  </Dropdown.Item>
                ) : null}
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
    </aside>
  );
}

export function MobileSidebarNavigation({
  navItems,
  iconSet = "lucide",
  navLabel = "Admin navigation",
  menuLabel = "Admin pages",
  buttonLabel = "Open admin navigation",
}: {
  navItems: NavItem[];
  iconSet?: "lucide" | "tabler";
  navLabel?: string;
  menuLabel?: string;
  buttonLabel?: string;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={navLabel}
      className="fixed bottom-4 left-4 z-40 md:hidden"
    >
      <Dropdown>
        <Button
          variant="primary"
          className="rounded-full shadow-sm"
          aria-label={buttonLabel}
        >
          {iconSet === "tabler" ? (
            <IconMenu2 size={18} aria-hidden="true" />
          ) : (
            <Menu size={18} aria-hidden="true" />
          )}{" "}
          Menu
        </Button>
        <Dropdown.Popover placement="top start">
          <Dropdown.Menu aria-label={menuLabel}>
            {navItems.map(({ href, label, icon }) => {
              const Icon =
                iconSet === "tabler"
                  ? (ADMIN_ICON_MAP[icon] ?? IconSearch)
                  : (ICON_MAP[icon] ?? Search);
              return (
                <Dropdown.Item
                  key={href}
                  id={href}
                  textValue={label}
                  href={href}
                  aria-current={isActive(pathname, href) ? "page" : undefined}
                >
                  <Label className="flex items-center gap-2">
                    <Icon size={18} aria-hidden="true" />
                    {label}
                  </Label>
                </Dropdown.Item>
              );
            })}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </nav>
  );
}

export default AppSidebar;
