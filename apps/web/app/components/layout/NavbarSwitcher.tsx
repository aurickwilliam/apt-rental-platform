"use client";

import { Suspense } from "react";
import AppNavbar from "./AppNavbar";

export default function NavbarSwitcher() {
  return (
    <Suspense fallback={null}>
      <AppNavbar />
    </Suspense>
  );
}
