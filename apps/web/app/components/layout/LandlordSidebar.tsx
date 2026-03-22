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
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Button,
} from "@heroui/react";
import Image from "next/image";
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
  { label: "Dashboard",      icon: LayoutDashboard, href: "/dashboard"    },
  { label: "My Properties",  icon: Building2,       href: "/properties"   },
  { label: "Messages",       icon: MessagesSquare,  href: "/messages"     },
  { label: "Applications",   icon: FileCheckCorner, href: "/applications" },
  { label: "Payments",       icon: Banknote,        href: "/payments"     },
];

export default function LandlordSidebar() {
  const { state } = useSidebar();
  const isExpanded = state === "expanded";

  const { user, profile, loading } = useUser();

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
                  <SidebarMenuButton asChild className="gap-3">
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
      <SidebarFooter>
        <Dropdown placement="top">
          <DropdownTrigger>
            <Button
              variant="light"
              className="flex w-full items-center justify-start gap-3 h-auto px-2 py-2"
            >
              <Avatar
                src={profile?.avatar_url ?? undefined}
                name={`${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`}
                size="md"
                className="shrink-0"
                classNames={{
                  base: "bg-primary",
                  name: "text-white font-medium",
                }}
              />
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
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="User actions">
            <DropdownItem key="profile" color="primary">Profile</DropdownItem>
            <DropdownItem key="settings" color="primary">Settings</DropdownItem>
            <DropdownItem
              key="logout"
              color="danger"
              className="text-danger"
              onPress={() => signOut()}
            >
              Log out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </SidebarFooter>
    </Sidebar>
  );
}
