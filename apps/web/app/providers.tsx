"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Toast } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getReducedMotion, subscribeReducedMotion } from "@/lib/reduced-motion";

function ReducedMotionPreference() {
  const enabled = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false);

  useEffect(() => {
    document.documentElement.classList.toggle("apt-reduce-motion", enabled);
  }, [enabled]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light">
      <ReducedMotionPreference />
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
