"use client";

import { useState, type ReactNode } from "react";
import { IconAdjustmentsHorizontal } from "@tabler/icons-react";
import { Badge, Button, Popover, Separator } from "@heroui/react";

interface FilterPopoverProps {
  /** Number of applied filters, shown as a badge on the trigger. */
  activeCount: number;
  /** Called when the popover opens so drafts can resync to applied values. */
  onOpen: () => void;
  onReset: () => void;
  onApply: () => void;
  children: ReactNode;
}

export default function FilterPopover({
  activeCount,
  onOpen,
  onReset,
  onApply,
  children,
}: FilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (open) onOpen();
        setIsOpen(open);
      }}
    >
      <Badge.Anchor>
        <Button
          variant="tertiary"
          className="cursor-pointer"
          aria-label={
            activeCount ? `Filters, ${activeCount} applied` : "Filters"
          }
        >
          <IconAdjustmentsHorizontal size={18} aria-hidden="true" />
          Filters
        </Button>
        {activeCount ? (
          // `!` beats @heroui/styles' unlayered badge colors.
          <Badge
            size="sm"
            placement="top-right"
            className="bg-primary! text-white!"
          >
            {activeCount}
          </Badge>
        ) : null}
      </Badge.Anchor>
      <Popover.Content
        placement="bottom end"
        className="w-[min(22rem,calc(100vw-2rem))]"
      >
        <Popover.Dialog className="max-h-[75vh] space-y-4 overflow-y-auto p-4">
          <Popover.Heading className="font-nunito text-base font-bold">
            Filters
          </Popover.Heading>
          {children}
          <Separator />
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onPress={onReset}
              className="cursor-pointer"
            >
              Reset
            </Button>
            <Button
              variant="primary"
              size="sm"
              onPress={() => {
                onApply();
                setIsOpen(false);
              }}
              className="cursor-pointer"
            >
              Apply
            </Button>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
