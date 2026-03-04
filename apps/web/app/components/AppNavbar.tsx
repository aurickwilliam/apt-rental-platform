"use client";

import { useState } from "react";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, NavbarMenuToggle, NavbarMenu, NavbarMenuItem } from "@heroui/navbar";
import { Link } from "@heroui/link";
import { Button } from "@heroui/button";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { label: "Find a Home", href: "#" },
  { label: "For Owners", href: "#" },
  { label: "Browse", href: "#" },
];

export default function AppNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
          <p className="font-poppins font-semibold text-2xl text-primary">APT</p>
        </NavbarBrand>
      </NavbarContent>

      {/* Desktop links */}
      <NavbarContent justify="end" className="hidden sm:flex gap-5">
        {navLinks.map((link) => (
          <NavbarItem key={link.label}>
            <Link color="foreground" href={link.href} className="font-medium">
              {link.label}
            </Link>
          </NavbarItem>
        ))}
        <NavbarItem>
          <ThemeToggle />
        </NavbarItem>
        <NavbarItem>
          <Button as={Link} color="primary" href="#" variant="flat" radius="full">
            Sign Up
          </Button>
        </NavbarItem>
      </NavbarContent>

      {/* Mobile menu */}
      <NavbarMenu>
        {navLinks.map((link) => (
          <NavbarMenuItem key={link.label}>
            <Link color="foreground" href={link.href} className="w-full font-medium" size="lg">
              {link.label}
            </Link>
          </NavbarMenuItem>
        ))}
        <NavbarMenuItem>
          <ThemeToggle />
        </NavbarMenuItem>

        <NavbarMenuItem>
          <Button as={Link} color="primary" href="#" variant="flat" radius="full">
            Sign Up
          </Button>
        </NavbarMenuItem>
      </NavbarMenu>
    </Navbar>
  );
}
