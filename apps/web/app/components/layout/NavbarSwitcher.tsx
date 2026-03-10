"use client";

import { useUser } from "@/hooks/use-user";
import AppNavbar from "./AppNavbar";
import TenantNavbar from "./TenantNavbar";

export default function NavbarSwitcher() {
  const { user, loading } = useUser();

  if (loading) {
    // Return AppNavbar as default while loading to avoid layout shift
    return <AppNavbar />;
  }

  return user ? <TenantNavbar /> : <AppNavbar />;
}
