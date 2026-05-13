"use client";

import { HeroUIProvider } from "@heroui/react";
import { ToastProvider } from "@heroui/toast";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="light">
        <TooltipProvider>
          {children}
          <ToastProvider
            placement="top-right"
            maxVisibleToasts={3}
            toastOffset={16}
            toastProps={{
              timeout: 2800,
              shouldShowTimeoutProgress: true,
            }}
          />
        </TooltipProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
