"use client";

import { useState } from "react";
import NextImage from "next/image";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

import { Navbar, NavbarBrand, NavbarContent, NavbarItem, NavbarMenuToggle, NavbarMenu, NavbarMenuItem } from "@heroui/navbar";
import { Link } from "@heroui/link";
import { Button } from "@heroui/button";

import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { label: "Find a Home", href: "#" },
  { label: "For Owners", href: "#" },
  { label: "Browse", href: "/browse" },
];

export default function AppNavbar() {
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

      <NavbarContent justify="center" className="hidden sm:flex gap-8">
        {navLinks.map((link) => (
          <NavbarItem key={link.label}  isActive={pathname === link.href}>
            <NextLink href={link.href} className={pathname === link.href ? "text-primary font-medium" : "text-foreground font-medium"}>
              {link.label}
            </NextLink>
          </NavbarItem>
        ))}
      </NavbarContent>

      {/* Desktop links */}
      <NavbarContent justify="end" className="hidden sm:flex gap-3">

        <NavbarItem>
          <Button as={Link} color="primary" href="/sign-in" variant="light" radius="full">
            Sign In
          </Button>
        </NavbarItem>

        <NavbarItem>
          <Button as={Link} color="primary" href="/sign-up" variant="solid" radius="full">
            Sign Up
          </Button>
        </NavbarItem>

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

        <NavbarItem>
          <Button as={Link} color="primary" href="/sign-in" variant="light" radius="full">
            Sign In
          </Button>
        </NavbarItem>

        <NavbarMenuItem>
          <Button as={Link} color="primary" href="/sign-up" variant="solid" radius="full">
            Sign Up
          </Button>
        </NavbarMenuItem>

        <NavbarMenuItem>
          <ThemeToggle />
        </NavbarMenuItem>
      </NavbarMenu>
    </Navbar>
  );
}
