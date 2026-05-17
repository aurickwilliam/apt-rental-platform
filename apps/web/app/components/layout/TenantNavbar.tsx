"use client";

import { useState } from "react";
import NextImage from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Menu, X } from "lucide-react";

import { signOut } from "@/app/(auth)/actions/sign-out";

import { useUser } from "@/hooks/use-user";
import {
  Avatar,
  Dropdown,
  Button,
  Label,
} from "@heroui/react";

import ThemeToggle from "./ThemeToggle";

const NAV_LINKS = [
  { label: "Browse", href: "/browse" },
  { label: "My Rental", href: "/tenant/my-rental" },
  { label: "Maintenance", href: "/tenant/maintenance" },
  { label: "Messages", href: "/tenant/messages" },
];

const getInitials = (value: string) => {
  const normalized = value.trim();
  if (!normalized) return "U";
  const parts = normalized.split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "U";
};

export default function TenantNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading, profile } = useUser();

  const displayName =
    `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() ||
    "Unknown";
  const avatarSrc = profile?.avatar_url?.trim() || undefined;

  return (
    <div className="sticky top-0 z-40 w-full border-b border-divider bg-background/70 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">

          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-3">
            <button
              className="sm:hidden p-2 rounded-md text-foreground"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link href="/">
              <NextImage
                src="/logo/logo-name-transparent.svg"
                alt="APT Logo"
                width={100}
                height={40}
                className="object-contain"
              />
            </Link>
          </div>

          {/* Right: nav links + avatar + theme (desktop) */}
          <div className="hidden sm:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={
                  pathname === link.href
                    ? "text-primary font-medium"
                    : "text-foreground font-medium"
                }
              >
                {link.label}
              </Link>
            ))}

            {loading ? (
              <div className="w-8 h-8 rounded-full bg-default-200 animate-pulse" />
            ) : (
              <Dropdown>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 h-auto px-2 py-1"
                >
                  <Avatar size="sm" className="shrink-0">
                    {avatarSrc && (
                      <Avatar.Image src={avatarSrc} alt={displayName} />
                    )}
                    <Avatar.Fallback className="bg-primary text-white font-medium">
                      {getInitials(displayName)}
                    </Avatar.Fallback>
                  </Avatar>
                  <span className="text-sm font-medium">{displayName}</span>
                </Button>

                <Dropdown.Popover>
                  <Dropdown.Menu
                    onAction={(key) => {
                      if (key === "profile")   window.location.href = "/profile";
                      if (key === "favorites") window.location.href = "/tenant/favorites";
                      if (key === "settings")  window.location.href = "/settings";
                      if (key === "logout")    signOut();
                    }}
                  >
                    <Dropdown.Item id="profile" textValue="Profile">
                      <Label>Profile</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="favorites" textValue="Favorites">
                      <Label>Favorites</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="settings" textValue="Settings">
                      <Label>Settings</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="logout" textValue="Log Out" variant="danger">
                      <Label>Log Out</Label>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            )}

            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden border-t border-divider bg-background px-4 py-4 flex flex-col gap-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={
                pathname === link.href
                  ? "text-primary font-medium"
                  : "text-foreground font-medium"
              }
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          <div className="h-px bg-divider" />

          {!loading && (
            <>
              <Link
                href="/profile"
                className="text-foreground font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Profile
              </Link>
              <Link
                href="/tenant/favorites"
                className="text-foreground font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Favorites
              </Link>
              <Link
                href="/settings"
                className="text-foreground font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                Settings
              </Link>
              <button
                onClick={() => { signOut(); setIsMenuOpen(false); }}
                className="text-danger font-medium text-left"
              >
                Log Out
              </button>
            </>
          )}

          <div className="h-px bg-divider" />
          <ThemeToggle />
        </div>
      )}
    </div>
  );
}