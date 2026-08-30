"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type AppTopBarProps = {
  titleMap: Record<string, string>;
};

function getTitle(pathname: string, titleMap: Record<string, string>) {
  const sorted = Object.keys(titleMap).sort((a, b) => b.length - a.length);
  for (const route of sorted) {
    if (pathname === route || pathname.startsWith(route + "/")) {
      return titleMap[route];
    }
  }
  return Object.values(titleMap)[0] ?? "";
}

export function AppTopBar({ titleMap }: AppTopBarProps) {
  const pathname = usePathname();
  const title = getTitle(pathname, titleMap);

  const [todayLabel, setTodayLabel] = useState("");

  useEffect(() => {
    setTodayLabel(
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
    );
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-end gap-4 bg-card border-b border-border px-6 py-4">
      <p className="hidden sm:block text-sm text-muted-foreground" suppressHydrationWarning>
        {todayLabel}
      </p>
    </header>
  );
}

export default AppTopBar;
