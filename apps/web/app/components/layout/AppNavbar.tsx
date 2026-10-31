"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, type MouseEvent } from "react";

import { Dropdown, Button, Label, buttonVariants } from "@heroui/react";
import { IconMenu2 as Menu, IconX as X } from "@tabler/icons-react";

import type { TranslationKey } from "@repo/i18n";

import { useHydrated } from "@/hooks/use-hydrated";

import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "@/app/components/i18n/LanguageToggle";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import UserAvatar from "@/app/components/profile/UserAvatar";
import { useUser } from "@/hooks/use-user";
import { signOut } from "@/service/signOutService";
import { SETTINGS_QUERY_VALUE } from "@/app/components/settings/SettingsOverlay";
import { PORTAL_COOKIE, preferredPortal } from "@/lib/portal-preference";

const NAV_LINKS: { labelKey: TranslationKey; href: string }[] = [
  { labelKey: "nav.browseApartments", href: "/browse" },
  { labelKey: "nav.forOwners", href: "/forowners" },
];

const SECTION_LINKS: { labelKey: TranslationKey; href: string }[] = [
  { labelKey: "nav.howItWorks", href: "#how-it-works" },
  { labelKey: "nav.team", href: "#team" },
  { labelKey: "nav.faqs", href: "#faqs" },
  { labelKey: "nav.contact", href: "#contact" },
];

const getInitials = (value: string) => {
  const normalized = value.trim();
  if (!normalized) return "U";
  const parts = normalized.split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "U";
};

export default function AppNavbar() {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const mounted = useHydrated();

  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading } = useUser();
  const isLanding = pathname === "/";

  // The landing menu holds more links than the compact public header. Close it
  // before measuring the target so the sticky offset is not changed by the
  // menu's height while the browser scrolls.
  const closeMenuAndScroll = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault();
    setIsMenuOpen(false);
    window.history.replaceState(null, "", href);
    window.setTimeout(() => {
      document.getElementById(href.slice(1))?.scrollIntoView({ block: "start" });
    }, 0);
  };

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

  // Match each route's CSS breakpoint so a menu hidden on desktop cannot
  // unexpectedly reopen when the window returns to the compact layout.
  useEffect(() => {
    const desktop = window.matchMedia(isLanding ? "(min-width: 1280px)" : "(min-width: 768px)");
    // The menu starts closed; only widening the window needs to close it.
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsMenuOpen(false);
    };
    desktop.addEventListener("change", handleChange);
    return () => desktop.removeEventListener("change", handleChange);
  }, [isLanding]);

  const firstName = user?.user_metadata?.first_name ?? "";
  const lastName  = user?.user_metadata?.last_name  ?? "";
  const displayName = firstName ? `${firstName} ${lastName}`.trim() : (user?.email ?? "");
  // Prefer the canonical users.avatar_url (synced on upload) over the
  // stale auth-metadata copy.
  const avatarSrc = profile?.avatar_url?.trim() || user?.user_metadata?.avatar_url?.trim() || undefined;

  return (
    <header className="public-navbar sticky top-0 z-40 w-full min-w-0 border-b border-divider bg-background/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex min-h-20 items-center justify-between gap-3">

          {/* Left: hamburger + logo */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Button
              ref={menuToggleRef}
              isIconOnly
              variant="ghost"
              className={`public-menu-toggle${isLanding ? " landing-menu-toggle" : ""}`}
              onPress={() => setIsMenuOpen((prev) => !prev)}
              aria-label={isMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              aria-expanded={isMenuOpen}
              aria-controls="public-mobile-menu"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>

            <Link href="/" className="min-w-0 shrink rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
              <Image
                src="/logo/logo-name-transparent.svg"
                alt="APT Logo"
                width={100}
                height={46}
                className="max-w-[45vw] object-contain sm:max-w-none"
              />
            </Link>
          </div>

          {/* Center: nav links (desktop) */}
          <nav
            aria-label={t("nav.mainNavigation")}
            className={
              isLanding
                ? "hidden items-center gap-4 text-sm xl:flex xl:gap-6"
                : "hidden items-center gap-6 text-sm md:flex lg:gap-10"
            }
          >
            {NAV_LINKS.map(({ labelKey, href }) => (
              <Link
                key={labelKey}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className={
                  pathname === href
                    ? "public-nav-link text-secondary-foreground font-medium"
                    : "public-nav-link text-foreground font-medium"
                }
              >
                {t(labelKey)}
              </Link>
            ))}
            {isLanding
              ? SECTION_LINKS.map(({ labelKey, href }) => (
                  <a
                    key={href}
                    href={href}
                    className="public-nav-link whitespace-nowrap text-foreground font-medium"
                  >
                    {t(labelKey)}
                  </a>
                ))
              : null}
          </nav>

          {/* Right: theme + auth (desktop) */}
          <div className="hidden min-w-0 flex-1 items-center justify-end gap-2 md:flex lg:gap-3">
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
                  <span className="max-w-24 truncate text-sm font-medium lg:max-w-32">{displayName}</span>
                </Button>

                <Dropdown.Popover>
                  <Dropdown.Menu
                    onAction={(key) => {
                      if (key === "profile")   router.push(getProfileHref());
                      if (key === "dashboard") router.push(getDashboardHref());
                      if (key === "settings")  openSettings();
                      if (key === "logout")    signOut();
                    }}
                  >
                    <Dropdown.Item id="profile" textValue={t("nav.profile")}>
                      <Label>{t("nav.profile")}</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="dashboard" textValue={t("nav.dashboard")}>
                      <Label>{t("nav.dashboard")}</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="settings" textValue={t("nav.settings")}>
                      <Label>{t("nav.settings")}</Label>
                    </Dropdown.Item>
                    <Dropdown.Item id="logout" textValue={t("nav.logOut")} variant="danger">
                      <Label>{t("nav.logOut")}</Label>
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            ) : (
              <>
                <Link href="/sign-in" className={buttonVariants({ variant: "ghost" })}>
                  {t("nav.signIn")}
                </Link>
                <Link href="/sign-up" className={buttonVariants({ variant: "primary", className: "landing-cta" })}>
                  {t("nav.getStarted")}
                </Link>
              </>
            )}

            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <nav
          id="public-mobile-menu"
          aria-label={t("nav.mobileNavigation")}
          className={`${isLanding ? "landing-mobile-menu xl:hidden" : "md:hidden"} border-t border-divider bg-background px-6 py-4 flex flex-col gap-4`}
          onKeyDown={isLanding ? (event) => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            event.stopPropagation();
            setIsMenuOpen(false);
            menuToggleRef.current?.focus();
          } : undefined}
        >
          {NAV_LINKS.map(({ labelKey, href }) => (
            <Link
              key={labelKey}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className={
                pathname === href
                  ? "public-nav-link py-2 text-secondary-foreground font-medium"
                  : "public-nav-link py-2 text-foreground font-medium"
              }
              onClick={() => setIsMenuOpen(false)}
            >
              {t(labelKey)}
            </Link>
          ))}
          {isLanding
            ? SECTION_LINKS.map(({ labelKey, href }) => (
                <a
                  key={href}
                  href={href}
                  className="public-nav-link py-2 text-foreground font-medium"
                  onClick={(event) => closeMenuAndScroll(event, href)}
                >
                  {t(labelKey)}
                </a>
              ))
            : null}

          <div className="h-px bg-divider" />

          {!loading && user ? (
            <div className="flex flex-col gap-4">
              <Link href={getProfileHref()}   className="text-foreground font-medium" onClick={() => setIsMenuOpen(false)}>{t("nav.profile")}</Link>
              <Link href={getDashboardHref()} className="text-foreground font-medium" onClick={() => setIsMenuOpen(false)}>{t("nav.dashboard")}</Link>
              <Button
                variant="ghost"
                className="button--bare text-foreground font-medium text-left"
                onClick={() => { openSettings(); setIsMenuOpen(false); }}
              >
                {t("nav.settings")}
              </Button>
              <Button
                variant="ghost"
                onClick={() => { signOut(); setIsMenuOpen(false); }}
                className="button--bare text-danger font-medium text-left"
              >
                {t("nav.logOut")}
              </Button>
            </div>
          ) : !loading ? (
            <>
              {/* Full-width rows: the previous auto-width buttons left a
                  short, left-aligned target with dead space beside them,
                  which reads as broken at narrow widths. */}
              <div className="flex flex-col gap-3">
                <Link href="/sign-in" className={buttonVariants({ variant: "outline", fullWidth: true })} onClick={() => setIsMenuOpen(false)}>
                  {t("nav.signIn")}
                </Link>
                <Link href="/sign-up" className={buttonVariants({ variant: "primary", fullWidth: true, className: "landing-cta" })} onClick={() => setIsMenuOpen(false)}>
                  {t("nav.getStarted")}
                </Link>
              </div>
            </>
          ) : null}

          <div className="h-px bg-divider" />
          <LanguageToggle variant="menu" />
          <ThemeToggle />
        </nav>
      )}
    </header>
  );
}
