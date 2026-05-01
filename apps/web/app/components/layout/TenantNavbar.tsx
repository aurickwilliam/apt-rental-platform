"use client";

import { useState } from "react";
import NextImage from "next/image";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/app/(auth)/actions/sign-out";
import { useUser } from "@/hooks/use-user";

import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@heroui/navbar";
import {
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";

import ThemeToggle from "./ThemeToggle";

const navLinks = [
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

  // Get display name and initials from user metadata
  const displayName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "Unknown";
  const avatarSrc = profile?.avatar_url?.trim() || undefined;

  return (
    <Navbar
      isBordered
      maxWidth="xl"
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
    >
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden"
        />
        <NavbarBrand>
          <NextLink href="/">
            <NextImage
              src={"/logo/logo-name-transparent.svg"}
              alt="Apt Rental Logo"
              width={100}
              height={25}
            />
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      {/* Desktop links */}
      <NavbarContent justify="end" className="hidden sm:flex gap-5">
        {navLinks.map((link) => (
          <NavbarItem key={link.label} isActive={pathname === link.href}>
            <NextLink
              href={link.href}
              className={
                pathname === link.href
                  ? "text-primary font-medium"
                  : "text-foreground font-medium"
              }
            >
              {link.label}
            </NextLink>
          </NavbarItem>
        ))}

        {loading ? (
          <NavbarItem>
            <div className="w-8 h-8 rounded-full bg-default-200 animate-pulse" />
          </NavbarItem>
        ) : (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                src={avatarSrc}
                as="button"
                size="sm"
                className="cursor-pointer"
                name={displayName}
                showFallback
                getInitials={getInitials}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="User actions">
              <DropdownItem
                key="user-info"
                isReadOnly
                className="opacity-100 cursor-default"
              >
                <p className="font-semibold">{displayName}</p>
                {user?.email && (
                  <p className="text-xs text-default-400">{user?.email}</p>
                )}
              </DropdownItem>
              <DropdownItem key="profile" href="/profile" color="primary">
                Profile
              </DropdownItem>
              <DropdownItem key="settings" href="/settings" color="primary">
                Settings
              </DropdownItem>
              <DropdownItem
                key="logout"
                color="danger"
                className="text-danger"
                onPress={() => signOut()}
              >
                Log Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )}

        {/* Switching to Dark Mode */}
        <NavbarItem>
          <ThemeToggle />
        </NavbarItem>
      </NavbarContent>

      {/* Mobile menu */}
      <NavbarMenu>
        {navLinks.map((link) => (
          <NavbarMenuItem key={link.label} isActive={pathname === link.href}>
            <NextLink
              href={link.href}
              className={
                pathname === link.href
                  ? "text-primary font-medium"
                  : "text-foreground font-medium"
              }
            >
              {link.label}
            </NextLink>
          </NavbarMenuItem>
        ))}

        <NavbarMenuItem>
          <ThemeToggle />
        </NavbarMenuItem>
      </NavbarMenu>
    </Navbar>
  );
}
