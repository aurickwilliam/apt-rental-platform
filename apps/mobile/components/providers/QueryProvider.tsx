import { QueryClientProvider, focusManager } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { AppState } from "react-native";

import { queryClient } from "@/utils/queryClient";

interface QueryProviderProps {
  children: ReactNode;
}

function AppStateFocusBridge() {
  useEffect(() => {
    return focusManager.setEventListener((handleFocus) => {
      const updateFocus = (appState: string) => {
        handleFocus(appState === "active");
      };

      updateFocus(AppState.currentState);
      const subscription = AppState.addEventListener("change", updateFocus);

      return () => subscription.remove();
    });
  }, []);

  return null;
}

export default function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppStateFocusBridge />
      {children}
    </QueryClientProvider>
  );
}
