"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Avatar, Dropdown, Button, Label } from "@heroui/react";
import { buttonVariants } from "@heroui/styles";
import { Building2, Search, Menu, X } from "lucide-react";

import ThemeToggle from "./ThemeToggle";
import { useUser } from "@/hooks/use-user";
import { signOut } from "@/app/(auth)/actions/sign-out";

const NAV_LINKS = [
  { label: "For Owners", icon: Building2, href: "#" },
  { label: "Browse",     icon: Search,    href: "/browse" },
];

const getInitials = (value: string) => {
  const normalized = value.trim();
  if (!normalized) return "U";
  const parts = normalized.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U";
};

export default function AppNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const pathname = usePathname();
  const { user, loading } = useUser();

  const firstName = user?.user_metadata?.first_name ?? "";
  const lastName  = user?.user_metadata?.last_name  ?? "";
  const displayName = firstName ? `${firstName} ${lastName}`.trim() : (user?.email ?? "");
  const avatarSrc = user?.user_metadata?.avatar_url?.trim() || undefined;

  return (
    <div className="sticky top-0 z-40 w-full border-b border-divider bg-background/70 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">

          {/* Left: hamburger + logo */}
          <div className="flex flex-1 items-center gap-3">
            <button
              className="sm:hidden p-2 rounded-md text-foreground"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link href="/">
              <Image
                src="/logo/logo-name-transparent.svg"
                alt="APT Logo"
                width={100}
                height={40}
                className="object-contain"
              />
            </Link>
          </div>

          {/* Center: nav links (desktop) */}
          <nav className="hidden sm:flex items-center gap-8">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className={
                  pathname === href
                    ? "text-primary font-medium"
                    : "text-foreground font-medium"
                }
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right: theme + auth (desktop) */}
          <div className="hidden sm:flex items-center gap-3 flex-1 justify-end">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-default-200 animate-pulse" />
            ) : user ? (
              <Dropdown>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 h-auto px-2 py-1"
                >
                  <Avatar size="sm" className="shrink-0">
                    {avatarSrc && <Avatar.Image src={avatarSrc} alt={displayName} />}
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
                      if (key === "dashboard") window.location.href = "/my-rental";
                      if (key === "settings")  window.location.href = "/settings";
                      if (key === "logout")    signOut();
                    }}
                  >
                    <Dropdown.Item id="profile" textValue="Profile">
                      <Label>Profile</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="dashboard" textValue="Dashboard">
                      <Label>Dashboard</Label>
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
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost">
                    Sign In
                  </Button>
                </Link>

                <Link href="/sign-up">
                  <Button>
                    Sign Up
                  </Button>
                </Link>
              </>
            )}

            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden border-t border-divider bg-background px-4 py-4 flex flex-col gap-4">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className={
                pathname === href
                  ? "text-primary font-medium"
                  : "text-foreground font-medium"
              }
              onClick={() => setIsMenuOpen(false)}
            >
              {label}
            </Link>
          ))}

          <div className="h-px bg-divider" />

          {!loading && user ? (
            <>
              <Link href="/profile"   className="text-foreground font-medium" onClick={() => setIsMenuOpen(false)}>Profile</Link>
              <Link href="/my-rental" className="text-foreground font-medium" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
              <Link href="/settings"  className="text-foreground font-medium" onClick={() => setIsMenuOpen(false)}>Settings</Link>
              <button
                onClick={() => { signOut(); setIsMenuOpen(false); }}
                className="text-danger font-medium text-left"
              >
                Log Out
              </button>
            </>
          ) : !loading ? (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" className="rounded-full">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button variant="primary" className="rounded-full">
                  Sign Up
                </Button>
              </Link>
            </>
          ) : null}

          <div className="h-px bg-divider" />
          <ThemeToggle />
        </div>
      )}
    </div>
  );
}