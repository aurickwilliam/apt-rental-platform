"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  IconBuilding,
  IconChartBar,
  IconHistory,
  IconLayoutDashboard,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconLogout,
  IconMenu2,
  IconSearch,
  IconSelector,
  IconShieldCheck,
  IconUsers,
  IconUser,
  type Icon as TablerIcon,
} from "@tabler/icons-react";

import { Avatar, Button, Dropdown, Label } from "@heroui/react";
import {
  LogOut,
  ChevronsUpDown,
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
  Menu,
} from "lucide-react";

import { signOut } from "@/app/(auth)/actions/sign-out";

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
  Building2: IconBuilding,
  ShieldCheck: IconShieldCheck,
  History: IconHistory,
  ChartBar: IconChartBar,
};

const ADMIN_SIDEBAR_STORAGE_KEY = "admin-sidebar-collapsed";
const ADMIN_SIDEBAR_CHANGE_EVENT = "admin-sidebar-change";

function subscribeToSidebarState(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === ADMIN_SIDEBAR_STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(ADMIN_SIDEBAR_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(ADMIN_SIDEBAR_CHANGE_EVENT, onChange);
  };
}

function getStoredSidebarState() {
  try {
    return window.localStorage.getItem(ADMIN_SIDEBAR_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function toggleStoredSidebarState(collapsed: boolean) {
  try {
    window.localStorage.setItem(ADMIN_SIDEBAR_STORAGE_KEY, String(!collapsed));
    window.dispatchEvent(new Event(ADMIN_SIDEBAR_CHANGE_EVENT));
  } catch {
    // Storage may be unavailable; keep the expanded sidebar usable.
  }
}

function getInitialSidebarState() {
  return false;
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
  avatarUrl?: string | null;
  showAccountLinks?: boolean;
  // Multi-role switching: all roles the account holds + which portal
  // this sidebar belongs to. The switch item only appears when the
  // account holds the other portal's role.
  userRoles?: string[];
  activePortal?: "tenant" | "landlord";
  profileHref?: string;
  iconSet?: "lucide" | "tabler";
  collapsible?: boolean;
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
  avatarUrl,
  showAccountLinks = true,
  profileHref: accountProfileHref,
  iconSet = "lucide",
  collapsible = false,
  userRoles = [],
  activePortal,
}: AppSidebarProps) {
  const pathname = usePathname();
  const savedCollapsed = useSyncExternalStore(
    subscribeToSidebarState,
    getStoredSidebarState,
    getInitialSidebarState,
  );
  const collapsed = collapsible && savedCollapsed;

  const displayName = userName?.trim() || "User";
  const roleLabel = userRole?.trim() || "";
  const avatarSrc = avatarUrl?.trim() || undefined;
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
      aria-label={collapsible ? "Admin sidebar" : "Portal sidebar"}
      className={`hidden md:flex shrink-0 flex-col bg-sidebar border-r border-sidebar-border min-h-screen sticky top-0 h-screen shadow-sm text-sidebar-foreground ${collapsible ? "font-nunito" : ""} ${collapsed ? "w-16" : "w-64"}`}
    >
      {/* In the collapsed admin rail, the logo doubles as the expand control. */}
      <div
        className={`flex border-b border-sidebar-border bg-sidebar ${collapsed ? "justify-center px-2 py-3" : "items-center justify-between gap-2 px-5 py-5"}`}
      >
        {collapsed ? (
          <button
            type="button"
            aria-label="Expand sidebar"
            aria-expanded={false}
            onClick={() => toggleStoredSidebarState(collapsed)}
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
            onClick={() => toggleStoredSidebarState(collapsed)}
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
            <Avatar size="sm" className="shrink-0 bg-primary text-white">
              {avatarSrc ? (
                <Avatar.Image src={avatarSrc} alt={`${displayName}'s profile photo`} />
              ) : null}
              <Avatar.Fallback className="bg-primary text-white">
                {getInitials(displayName)}
              </Avatar.Fallback>
            </Avatar>
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
                if (key === "settings") window.location.href = "/settings";
                if (key === "switch-role" && switchTarget) window.location.href = switchTarget.href;
                if (key === "logout") signOut();
              }}
            >
              {showAccountLinks ? (<>
                <Dropdown.Item id="profile" textValue="Profile">
                  <Label>Profile</Label>
                </Dropdown.Item>
                {switchTarget ? (
                  <Dropdown.Item id="switch-role" textValue={switchTarget.label}>
                    <Label>{switchTarget.label}</Label>
                  </Dropdown.Item>
                ) : null}
                {!accountProfileHref ? (
                  <Dropdown.Item id="settings" textValue="Settings">
                    <Label>Settings</Label>
                  </Dropdown.Item>
                ) : null}
              </>) : null}
              <Dropdown.Item id="logout" variant="danger" textValue="Log Out">
                <Label className="flex items-center gap-2">
                  {iconSet === "tabler" ? (
                    <IconLogout size={14} />
                  ) : (
                    <LogOut size={14} />
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
}: {
  navItems: NavItem[];
  iconSet?: "lucide" | "tabler";
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin navigation"
      className="fixed bottom-4 left-4 z-40 md:hidden"
    >
      <Dropdown>
        <Button
          variant="primary"
          className="rounded-full shadow-sm"
          aria-label="Open admin navigation"
        >
          {iconSet === "tabler" ? (
            <IconMenu2 size={18} aria-hidden="true" />
          ) : (
            <Menu size={18} aria-hidden="true" />
          )}{" "}
          Menu
        </Button>
        <Dropdown.Popover placement="top start">
          <Dropdown.Menu aria-label="Admin pages">
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
