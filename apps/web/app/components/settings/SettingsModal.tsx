"use client";

import { useState } from "react";
import {
  Sun,
  ShieldCheck,
  Globe,
  Bell,
  HelpCircle,
  Settings as SettingsIcon,
} from "lucide-react";
import {
  IconBell,
  IconGlobe,
  IconHelpCircle,
  IconSettings,
  IconShieldLock,
  IconSun,
} from "@tabler/icons-react";
import { Modal } from "@heroui/react";

import { useUser } from "@/hooks/use-user";
import GeneralTab from "./tabs/GeneralTab";
import SecurityTab from "./tabs/SecurityTab";
import LanguageRegionTab from "./tabs/LanguageRegionTab";
import NotificationsTab from "./tabs/NotificationsTab";
import HelpTab from "./tabs/HelpTab";

type TabId = "general" | "security" | "language" | "notifications" | "help";

const TAB_META = [
  { id: "general", label: "General", lucide: Sun, tabler: IconSun },
  { id: "security", label: "Security", lucide: ShieldCheck, tabler: IconShieldLock },
  { id: "language", label: "Language & Region", lucide: Globe, tabler: IconGlobe },
  { id: "notifications", label: "Notifications", lucide: Bell, tabler: IconBell },
  { id: "help", label: "Help & Support", lucide: HelpCircle, tabler: IconHelpCircle },
] as const;

export default function SettingsModal({
  open,
  onClose,
  iconSet = "lucide",
}: {
  open: boolean;
  onClose: () => void;
  iconSet?: "lucide" | "tabler";
}) {
  const { profile } = useUser();
  const roles = profile?.roles ?? [];
  const isAdmin = roles.includes("admin");
  const [tab, setTab] = useState<TabId>("general");

  const visibleTabs = TAB_META;
  const activeId: TabId = visibleTabs.some((t) => t.id === tab) ? tab : "general";
  const HeaderIcon = iconSet === "tabler" ? IconSettings : SettingsIcon;

  return (
    <Modal
      isOpen={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <Modal.Backdrop>
        <Modal.Container
          placement="center"
          size="lg"
          scroll="inside"
          className="w-full max-w-5xl sm:w-full"
        >
          <Modal.Dialog className="h-[calc(100dvh-2rem)] w-full max-w-5xl! overflow-hidden rounded-3xl bg-card p-0 md:h-[85dvh]">
            <Modal.CloseTrigger
              aria-label="Close settings"
              className="text-foreground"
            />
            <Modal.Header className="shrink-0 border-b border-border px-5 py-4 pr-12">
              <Modal.Heading className="font-nunito text-2xl text-primary font-bold flex flex-row items-center">
                <HeaderIcon
                  size={28}
                  className="mr-2 inline"
                  aria-hidden="true"
                />
                Settings
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="mt-0! min-h-0 overflow-hidden! p-0">
              <div className="flex h-full min-h-0 flex-col md:flex-row">
                <nav
                  aria-label="Settings sections"
                  className="flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-muted/40 p-3 md:w-52 md:flex-col md:overflow-x-hidden md:overflow-y-auto md:border-r md:border-b-0"
                >
                  {visibleTabs.map(({ id, label, lucide: LucideIcon, tabler: TablerIcon }) => {
                    const Icon = iconSet === "tabler" ? TablerIcon : LucideIcon;
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-current={activeId === id ? "page" : undefined}
                        onClick={() => setTab(id)}
                        className={`flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${activeId === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-background hover:text-foreground"}`}
                      >
                        <Icon size={18} aria-hidden="true" />
                        {label}
                      </button>
                    );
                  })}
                </nav>
                <section
                  key={activeId}
                  aria-label={visibleTabs.find(({ id }) => id === activeId)?.label}
                  className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5"
                >
                  {activeId === "general" ? <GeneralTab iconSet={iconSet} /> : null}
                  {activeId === "security" ? <SecurityTab isAdmin={isAdmin} iconSet={iconSet} /> : null}
                  {activeId === "language" ? <LanguageRegionTab iconSet={iconSet} /> : null}
                  {activeId === "notifications" ? <NotificationsTab isAdmin={isAdmin} iconSet={iconSet} /> : null}
                  {activeId === "help" ? <HelpTab isAdmin={isAdmin} iconSet={iconSet} /> : null}
                </section>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
