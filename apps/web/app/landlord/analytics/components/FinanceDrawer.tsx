"use client";

import type { ReactNode } from "react";
import { Drawer } from "@heroui/react";
import { IconX } from "@tabler/icons-react";

interface FinanceDrawerProps {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  onClose: () => void;
  busy?: boolean;
}

/**
 * Right-hand editor panel for the Profit & planning forms. The report stays
 * visible behind it; HeroUI owns focus trapping and restoration. While a save
 * is pending the drawer refuses Escape, backdrop and close-button dismissal.
 */
export default function FinanceDrawer({
  title,
  description,
  children,
  footer,
  onClose,
  busy = false,
}: FinanceDrawerProps) {
  return (
    <Drawer
      isOpen
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <Drawer.Backdrop isDismissable={!busy} isKeyboardDismissDisabled={busy}>
        <Drawer.Content placement="right">
          <Drawer.Dialog className="finance-drawer flex h-full w-[calc(100vw-1rem)] max-w-md flex-col p-0">
            <Drawer.CloseTrigger
              aria-label={`Close ${title.toLowerCase()}`}
              isDisabled={busy}
            >
              <IconX size={16} className="text-foreground" aria-hidden />
            </Drawer.CloseTrigger>
            <Drawer.Header className="border-b border-border px-5 py-4">
              <Drawer.Heading className="font-nunito text-xl font-bold">
                {title}
              </Drawer.Heading>
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            </Drawer.Header>
            <Drawer.Body className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {children}
            </Drawer.Body>
            <Drawer.Footer className="flex-col items-stretch gap-3 border-t border-border px-5 py-4">
              {footer}
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
