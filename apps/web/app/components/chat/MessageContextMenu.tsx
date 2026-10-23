"use client";

import { Menu, Popover, Separator } from "@heroui/react";
import { IconCopy, IconCornerUpLeft, IconTrash } from "@tabler/icons-react";
import { useEffect, useRef } from "react";

export interface MessageContextMenuData {
  /** Human-readable timestamp shown in the menu header. */
  dateLabel: string;
  /** Only text messages can be copied. */
  canCopy: boolean;
  /** Only your own saved messages can be unsent; others see it disabled (mobile parity). */
  canUnsend: boolean;
}

interface MessageContextMenuProps {
  data: MessageContextMenuData;
  position: { x: number; y: number };
  onReply: () => void;
  onCopy: () => void;
  onUnsend: () => void;
  onClose: () => void;
}

/**
 * Contextual action card: timestamp, Reply, Copy and Unsend (mirrors the
 * mobile HoldMenu). Opened by right-click (desktop) or long-press (touch).
 * Reactions live on the message toolbar's React button.
 *
 * A HeroUI Popover anchored to a zero-size element at the pointer, so
 * placement, viewport flipping/shifting, focus containment, Escape and
 * outside-press dismissal come from HeroUI; the actions are a HeroUI Menu.
 */
export default function MessageContextMenu({
  data,
  position,
  onReply,
  onCopy,
  onUnsend,
  onClose,
}: MessageContextMenuProps) {
  const anchorRef = useRef<HTMLSpanElement>(null);

  // The popover's underlay covers the page, so a right-click outside the card
  // lands on it: dismiss instead of opening the browser's own menu.
  useEffect(() => {
    const dismissOnContextMenu = (event: MouseEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest("[role=dialog]")
      )
        return;
      event.preventDefault();
      onClose();
    };
    document.addEventListener("contextmenu", dismissOnContextMenu, true);
    return () =>
      document.removeEventListener("contextmenu", dismissOnContextMenu, true);
  }, [onClose]);

  return (
    <>
      <span
        ref={anchorRef}
        aria-hidden="true"
        className="pointer-events-none fixed size-px"
        style={{ left: position.x, top: position.y }}
      />
      <Popover
        isOpen
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <Popover.Content
          triggerRef={anchorRef}
          placement="bottom start"
          offset={0}
          containerPadding={8}
          className="w-52 max-w-[calc(100vw-1.5rem)]"
        >
          <Popover.Dialog
            aria-label="Message actions"
            className="outline-none p-2"
          >
            <p className="py-1 text-center font-inter text-xs text-muted-foreground">
              {data.dateLabel || "Just now"}
            </p>

            <Separator className="my-1" />

            <Menu
              aria-label="Message actions"
              className="gap-1"
              autoFocus="first"
              disabledKeys={data.canUnsend ? [] : ["unsend"]}
              onAction={(key) => {
                if (key === "reply") onReply();
                else if (key === "copy") onCopy();
                else if (key === "unsend") onUnsend();
              }}
            >
              <Menu.Item
                id="reply"
                textValue="Reply to message"
                className="min-h-8 gap-2 px-2 py-1"
              >
                <IconCornerUpLeft
                  size={20}
                  className="shrink-0"
                  aria-hidden="true"
                />
                <span className="text-base">Reply</span>
              </Menu.Item>
              {data.canCopy ? (
                <Menu.Item
                  id="copy"
                  textValue="Copy message"
                  className="min-h-8 gap-2 px-2 py-1"
                >
                  <IconCopy size={20} className="shrink-0" aria-hidden="true" />
                  <span className="text-base">Copy</span>
                </Menu.Item>
              ) : null}
              <Menu.Item
                id="unsend"
                textValue="Unsend message"
                variant="danger"
                className="min-h-8 gap-2 px-2 py-1 data-[disabled=true]:opacity-40"
              >
                <IconTrash size={20} className="shrink-0" aria-hidden="true" />
                <span className="text-base">Unsend</span>
              </Menu.Item>
            </Menu>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
    </>
  );
}
