"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button, Dropdown } from "@heroui/react";

type NavItem = { href: string; label: string; icon: string };

interface AppTopBarProps {
  titleMap: Record<string, string>;
  navItems?: readonly NavItem[];
}

function getTitle(pathname: string, titleMap: Record<string, string>) {
  const sorted = Object.keys(titleMap).sort((a, b) => b.length - a.length);
  for (const route of sorted) {
    if (pathname === route || pathname.startsWith(`${route}/`)) return titleMap[route];
  }
  return Object.values(titleMap)[0] ?? "";
}

export function AppTopBar({ titleMap, navItems }: AppTopBarProps) {
  const pathname = usePathname();
  const title = getTitle(pathname, titleMap);
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border bg-card px-4 py-4 md:px-6">
      <div className="flex items-center gap-3">
        {navItems ? (
          <Dropdown>
            <Button isIconOnly variant="ghost" aria-label="Open admin navigation" className="md:hidden">
              <Menu size={20} />
            </Button>
            <Dropdown.Popover placement="bottom start">
              <Dropdown.Menu aria-label="Admin navigation">
                {navItems.map((item) => (
                  <Dropdown.Item key={item.href} id={item.href} textValue={item.label}>
                    <Link href={item.href} className="block">{item.label}</Link>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        ) : null}
        <h1 className="font-nunito text-lg font-bold text-foreground md:hidden">{title}</h1>
      </div>
    </header>
  );
}

export default AppTopBar;
