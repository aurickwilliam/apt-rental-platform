"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Toast } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getReducedMotion, subscribeReducedMotion } from "@/lib/reduced-motion";
import ResourceCacheLifecycle from "./components/layout/ResourceCacheLifecycle";

function ReducedMotionPreference() {
  const enabled = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);

  useEffect(() => {
    document.documentElement.classList.toggle("apt-reduce-motion", enabled);
  }, [enabled]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
      <ReducedMotionPreference />
      <ResourceCacheLifecycle />
      <TooltipProvider>
        {children}
        <Toast.Provider
          placement="top end"
          maxVisibleToasts={3}
          className="top-4 right-4"
        />
      </TooltipProvider>
    </NextThemesProvider>
  );
}
