"use client";

import { useState } from "react";
import NextImage from "next/image";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/app/(auth)/actions/sign-out";

import { Navbar, NavbarBrand, NavbarContent, NavbarItem, NavbarMenuToggle, NavbarMenu, NavbarMenuItem } from "@heroui/navbar";

import ThemeToggle from "./ThemeToggle";
import { Avatar, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";

const navLinks = [
  { label: "Browse", href: "/browse" },
  { label: "Maintenance", href: "/my-rentals" },
  { label: "Messages", href: "/my-rentals" },
];

export default function TenantNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const pathname = usePathname();

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
          <NavbarItem key={link.label}  isActive={pathname === link.href}>
            <NextLink href={link.href} className={pathname === link.href ? "text-primary font-medium" : "text-foreground font-medium"}>
              {link.label}
            </NextLink>
          </NavbarItem>
        ))}

        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Avatar
              as="button"
              size="sm"
              className="cursor-pointer"
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="User actions">
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

        {/* Switching to Dark Mode */}
        <NavbarItem>
          <ThemeToggle />
        </NavbarItem>

      </NavbarContent>

      {/* Mobile menu */}
      <NavbarMenu>
        {navLinks.map((link) => (
          <NavbarMenuItem key={link.label} isActive={pathname === link.href}>
            <NextLink href={link.href} className={pathname === link.href ? "text-primary font-medium" : "text-foreground font-medium"}>
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
