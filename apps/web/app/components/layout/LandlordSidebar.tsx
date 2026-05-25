"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import {
  Avatar,
  Dropdown,
  Label,
  Button,
} from "@heroui/react";

import Image from "next/image";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Building2,
  MessagesSquare,
  FileCheckCorner,
  Banknote,
  ChevronsUpDown,
} from "lucide-react";

import { signOut } from "@/app/(auth)/actions/sign-out";
import { useUser } from "@/hooks/use-user";


const MENU_ITEMS = [
  { label: "Dashboard",      icon: LayoutDashboard, href: "/landlord/dashboard"    },
  { label: "My Properties",  icon: Building2,       href: "/landlord/properties"   },
  { label: "Messages",       icon: MessagesSquare,  href: "/landlord/messages"     },
  { label: "Applications",   icon: FileCheckCorner, href: "/landlord/applications" },
  { label: "Payments",       icon: Banknote,        href: "/landlord/payments"     },
];

const getInitials = (value: string) => {
  const normalized = value.trim();
  if (!normalized) return "U";
  const parts = normalized.split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "U";
};

export default function LandlordSidebar() {
  const { state } = useSidebar();
  const isExpanded = state === "expanded";

  const pathname = usePathname();

  const { user, profile, loading } = useUser();
  const displayName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "Unknown";
  const avatarSrc = profile?.avatar_url?.trim() || undefined;

  return (
    <Sidebar className="w-64" collapsible="icon">
      {/* Header */}
      <SidebarHeader className="flex flex-row items-center justify-between px-4 py-3">
        {isExpanded ? (
          <>
            <Image
              src="/logo/logo-name-transparent.svg"
              alt="APT Logo"
              width={100}
              height={60}
              className="object-contain"
            />
            <SidebarTrigger />
          </>
        ) : (
          <div className="flex w-full items-center justify-center">
            <SidebarTrigger />
          </div>
        )}
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {MENU_ITEMS.map(({ label, icon: Icon, href }) => (
                <SidebarMenuItem key={label}>
                  <SidebarMenuButton 
                    asChild 
                    className="gap-3 data-[active=true]:bg-primary/15 data-[active=true]:text-primary"
                    isActive={pathname === href || pathname.startsWith(href + "/")}
                  >
                    <a href={href}>
                      <Icon className="w-5 h-5 shrink-0" />
                      <span>{label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="overflow-visible">
        <Dropdown>
          <Dropdown.Trigger>
            <div
              className={`rounded-full flex w-full items-center h-auto cursor-pointer hover:bg-grey-200 ${
                isExpanded
                  ? "justify-start gap-2 px-2 pr-3 py-2"
                  : "justify-center px-0 py-0 mb-2 min-w-0"
              }`}
            >
              <Avatar size={isExpanded ? "md" : "sm"} className="shrink-0 bg-primary">
                <Avatar.Image src={avatarSrc} alt={displayName} />
                <Avatar.Fallback>{getInitials(displayName)}</Avatar.Fallback>
              </Avatar>

              {isExpanded && (
                <>
                  <div className="flex flex-col text-left flex-1 min-w-0">
                    <span className="text-sm font-medium truncate">
                      {loading ? "Loading..." : `${profile?.first_name} ${profile?.last_name}`}
                    </span>
                    <span className="text-xs text-default-400 truncate">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="w-4 h-4 ml-auto shrink-0 text-default-400" />
                </>
              )}
            </div>
          </Dropdown.Trigger>
          
          <Dropdown.Popover placement="top">
            <Dropdown.Menu
              aria-label="User actions"
              onAction={(key) => {
                if (key === "logout") signOut()
                // Add other menus
              }}
            >
              <Dropdown.Item id="profile">
                <Label>Profile</Label>
              </Dropdown.Item>
              <Dropdown.Item id="settings">
                <Label>Settings</Label>
              </Dropdown.Item>
              <Dropdown.Item
                id="logout"
                variant="danger"
              >
                <Label>Log out</Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      </SidebarFooter>
    </Sidebar>
  );
}
