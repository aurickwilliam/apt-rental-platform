"use client";

import { Toast } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light">
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
