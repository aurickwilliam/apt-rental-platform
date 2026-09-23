"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

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
};

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

type AppSidebarProps = {
  navItems: NavItem[];
  userName: string;
  userRole: string;
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

function getInitials(value: string) {
  const normalized = value.trim();
  if (!normalized) return "U";
  const parts = normalized.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U";
}

export function AppSidebar({ navItems, userName, userRole }: AppSidebarProps) {
  const pathname = usePathname();

  const displayName = userName?.trim() || "User";
  const roleLabel = userRole?.trim() || "";
  const profileHref =
    roleLabel.toLowerCase() === "landlord" ? "/landlord/profile" : "/tenant/profile";

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar border-r border-sidebar-border min-h-screen sticky top-0 h-screen shadow-sm text-sidebar-foreground">
      {/* Logo — theme-aware: sidebar tokens switch via .dark */}
      <div className="px-5 py-5 border-b border-sidebar-border bg-sidebar">
        <Link href={navItems[0]?.href ?? "/"} className="flex items-center gap-2.5">
          <Image
            src="/logo/logo-name-transparent.svg"
            alt="APT Logo"
            width={118}
            height={42}
            className="object-contain"
            priority
          />
        </Link>
      </div>

      {/* Nav — good UX: clear hierarchy, 44px touch target, primary active */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map(({ label, href, icon }) => {
          const active = isActive(pathname, href);
          const Icon = ICON_MAP[icon] ?? Search;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring ${
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon size={18} className={`shrink-0 ${active ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60"}`} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer — theme-aware */}
      <div className="p-3 border-t border-sidebar-border bg-sidebar">
        <Dropdown>
          <Button
            variant="ghost"
            className="w-full flex items-center gap-3 h-auto px-2.5 py-2.5 justify-start hover:bg-sidebar-accent text-sidebar-foreground rounded-xl hover:text-sidebar-accent-foreground"
          >
            <Avatar size="sm" className="shrink-0 bg-primary text-white">
              <Avatar.Fallback className="bg-primary text-white">
                {getInitials(displayName)}
              </Avatar.Fallback>
            </Avatar>
            <span className="flex flex-col text-left flex-1 min-w-0">
              <span className="text-sm font-medium leading-none truncate text-sidebar-foreground">
                {displayName}
              </span>
              {roleLabel ? (
                <span className="text-xs text-sidebar-foreground/60 truncate">{roleLabel}</span>
              ) : null}
            </span>
            <ChevronsUpDown size={14} className="ml-auto text-sidebar-foreground/40 shrink-0" />
          </Button>
          <Dropdown.Popover placement="top">
            <Dropdown.Menu
              onAction={(key) => {
                if (key === "profile") window.location.href = profileHref;
                if (key === "settings") window.location.href = "/settings";
                if (key === "logout") signOut();
              }}
            >
              <Dropdown.Item id="profile" textValue="Profile">
                <Label>Profile</Label>
              </Dropdown.Item>
              <Dropdown.Item id="settings" textValue="Settings">
                <Label>Settings</Label>
              </Dropdown.Item>
              <Dropdown.Item id="logout" variant="danger" textValue="Log Out">
                <Label className="flex items-center gap-2">
                  <LogOut size={14} /> Log Out
                </Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </div>
    </aside>
  );
}

export default AppSidebar;
