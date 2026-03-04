"use client";

import { useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

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

  const { theme } = useTheme();
  const logoSrc = theme === "dark" ? "/logo-name.svg" : "/logo-white-name.svg";

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
          <Image 
            src={logoSrc}
            alt="Apt Rental Logo"
            width={100}
            height={25}
          />
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent justify="center" className="hidden sm:flex gap-8">
        {navLinks.map((link) => (
          <NavbarItem key={link.label}>
            <Link color="foreground" href={link.href} className="font-medium">
              {link.label}
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>

      {/* Desktop links */}
      <NavbarContent justify="end" className="hidden sm:flex gap-3">

        <NavbarItem>
          <Button as={Link} color="primary" href="#" variant="light" radius="full">
            Log In
          </Button>
        </NavbarItem>
        
        <NavbarItem>
          <Button as={Link} color="primary" href="#" variant="flat" radius="full">
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
