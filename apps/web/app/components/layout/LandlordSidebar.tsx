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
} from "@/components/ui/sidebar";

import { Avatar, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Image, Button } from "@heroui/react";
import NextImage from "next/image";

import {
  LayoutDashboard,
  Building2,
  MessagesSquare,
  FileCheckCorner,
  Banknote,
  ChevronsUpDown,
} from "lucide-react";

export default function LandlordSidebar() {

  const { state } = useSidebar();

  const menuItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard"
    },
    {
      label: "My Properties",
      icon: Building2,
      href: "/properties"
    },
    {
      label: "Messages",
      icon: MessagesSquare,
      href: "/messages"
    },
    {
      label: "Applications",
      icon: FileCheckCorner,
      href: "/applications",
    },
    {
      label: "Payments",
      icon: Banknote,
      href: "/payments",
    },
  ]

  return (
    <Sidebar variant="inset" className="w-64" collapsible="icon">
      <SidebarHeader className="flex items-start justify-center px-4">
        {
          state === "expanded" ? (
            <Image
              as={NextImage}
              src="/logo/logo-name-transparent.svg"
              alt="Logo"
              width={100}
              height={60}
              className="object-contain"
            />
          ) : (
            <Image
              as={NextImage}
              src="/logo/logo.svg"
              alt="Logo"
              width={30}
              height={30}
              className="object-contain"
            />
          )
        }
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild className="gap-3">
                    <a href={item.href} >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Dropdown placement="top" className="hover:cursor-pointer">
          <DropdownTrigger>
            <Button
              variant="light"
              className="flex w-full items-center justify-start gap-3 h-auto px-2 py-2"
            >
              <Avatar
                src="https://i.pravatar.cc/150"
                name="John Doe"
                size="md"
                className="shrink-0"
              />

              <div className="flex flex-col text-left flex-1 min-w-0">
                <span className="text-sm font-medium truncate">
                  John Doe
                </span>
                <span className="text-xs text-default-400 truncate">
                  john@example.com
                </span>
              </div>

              <ChevronsUpDown className="w-4 h-4 ml-auto shrink-0 text-default-400" />
            </Button>
          </DropdownTrigger>

          <DropdownMenu aria-label="User actions">
            <DropdownItem key="profile" color="primary">
              Profile
            </DropdownItem>
            <DropdownItem key="settings" color="primary">
              Settings
            </DropdownItem>
            <DropdownItem key="logout" color="danger" className="text-danger">
              Log out
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </SidebarFooter>
    </Sidebar>
  );
}
