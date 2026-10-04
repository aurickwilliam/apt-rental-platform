"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

import { Dropdown, Button, Label } from "@heroui/react";
import { Menu, X } from "lucide-react";

import ThemeToggle from "./ThemeToggle";
import UserAvatar from "@/app/components/profile/UserAvatar";
import { useUser } from "@/hooks/use-user";
import { signOut } from "@/app/(auth)/actions/sign-out";
import { SETTINGS_QUERY_VALUE } from "@/app/components/settings/SettingsOverlay";
import { PORTAL_COOKIE, preferredPortal } from "@/lib/portal-preference";

const NAV_LINKS = [
  { label: "For Owners", href: "/forowners" },
  { label: "Browse", href: "/browse" },
];

const getInitials = (value: string) => {
  const normalized = value.trim();
  if (!normalized) return "U";
  const parts = normalized.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U";
};

export default function AppNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading } = useUser();

  const openSettings = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("settings", SETTINGS_QUERY_VALUE);
    const query = params.toString();
    router.push(`${pathname}${query ? `?${query}` : ""}`);
  };

  const getDashboardHref = () => {
    if (profile?.roles.includes("admin")) return "/admin/dashboard";
    if (pathname.startsWith("/tenant") && profile?.roles.includes("tenant")) return "/tenant/my-rental";
    const selected = document.cookie.split("; ").find((item) => item.startsWith(`${PORTAL_COOKIE}=`))?.split("=")[1] ?? null;
    return preferredPortal(profile?.roles ?? [], selected) === "landlord"
      ? "/landlord/dashboard"
      : "/tenant/my-rental";
  };

  const getProfileHref = () => {
    if (pathname.startsWith("/landlord") && profile?.roles.includes("landlord")) return "/landlord/profile";
    if (profile?.roles.includes("admin")) return "/admin/dashboard";
    const selected = document.cookie.split("; ").find((item) => item.startsWith(`${PORTAL_COOKIE}=`))?.split("=")[1] ?? null;
    return preferredPortal(profile?.roles ?? [], selected) === "landlord"
      ? "/landlord/profile"
      : "/tenant/profile";
  };

   useEffect(() => {
    setMounted(true);
  }, []);

  // The mobile panel is hidden by `sm:hidden`, so a window widened past the
  // breakpoint would otherwise leave it "open" in state and re-shown on the
  // next shrink. Close it when the media query stops matching.
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 640px)");
    
    // Close menu if already above breakpoint on mount to prevent hydration
    // mismatches or transient "menu flash" at desktop widths.
    if (desktop.matches) {
      setIsMenuOpen(false);
    }
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsMenuOpen(false);
    };
    desktop.addEventListener("change", handleChange);
    return () => desktop.removeEventListener("change", handleChange);
  }, []);

  const firstName = user?.user_metadata?.first_name ?? "";
  const lastName  = user?.user_metadata?.last_name  ?? "";
  const displayName = firstName ? `${firstName} ${lastName}`.trim() : (user?.email ?? "");
  // Prefer the canonical users.avatar_url (synced on upload) over the
  // stale auth-metadata copy.
  const avatarSrc = profile?.avatar_url?.trim() || user?.user_metadata?.avatar_url?.trim() || undefined;

  return (
    <div className="sticky top-0 z-40 w-full min-w-0 border-b border-divider bg-surface/70 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* min-h-16 (not h-16) so a tall logo or wrapping brand never
            clips the bar at very narrow widths. */}
        <div className="flex min-h-16 items-center justify-between gap-3">

          {/* Left: hamburger + logo */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              className="sm:hidden shrink-0 p-2 rounded-md text-foreground"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link href="/" className="min-w-0 shrink">
              <Image
                src="/logo/logo-name-transparent.svg"
                alt="APT Logo"
                width={100}
                height={40}
                className="max-w-[45vw] object-contain sm:max-w-none"
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
            {!mounted || loading ? (
              <div className="w-8 h-8 rounded-full bg-default-200 animate-pulse" />
            ) : user ? (
              <Dropdown>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 h-auto px-2 py-1"
                >
                  <UserAvatar
                    src={avatarSrc}
                    initials={getInitials(displayName)}
                    alt={displayName}
                    size="sm"
                    className="shrink-0"
                    fallbackClassName="bg-primary text-white font-medium"
                  />
                  <span className="text-sm font-medium">{displayName}</span>
                </Button>

                <Dropdown.Popover>
                  <Dropdown.Menu
                    onAction={(key) => {
                      if (key === "profile")   window.location.href = getProfileHref();
                      if (key === "dashboard") window.location.href = getDashboardHref();
                      if (key === "settings")  openSettings();
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
            <div className="flex flex-col gap-4">
              <Link href={getProfileHref()}   className="text-foreground font-medium" onClick={() => setIsMenuOpen(false)}>Profile</Link>
              <Link href={getDashboardHref()} className="text-foreground font-medium" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
              <button
                type="button"
                className="text-foreground font-medium text-left"
                onClick={() => { openSettings(); setIsMenuOpen(false); }}
              >
                Settings
              </button>
              <button
                onClick={() => { signOut(); setIsMenuOpen(false); }}
                className="text-danger font-medium text-left"
              >
                Log Out
              </button>
            </div>
          ) : !loading ? (
            <>
              {/* Full-width rows: the previous auto-width buttons left a
                  short, left-aligned target with dead space beside them,
                  which reads as broken at narrow widths. */}
              <div className="flex flex-col gap-3">
                <Link
                  href="/sign-in"
                  className="w-full"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button variant="outline" className="w-full rounded-full">
                    Sign In
                  </Button>
                </Link>
                <Link
                  href="/sign-up"
                  className="w-full"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Button variant="primary" className="w-full rounded-full">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </>
          ) : null}

          <div className="h-px bg-divider" />
          <ThemeToggle />
        </div>
      )}
    </div>
  );
}
