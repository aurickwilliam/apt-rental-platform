"use client";

import { useMemo, useState } from "react";
import { Modal, ScrollShadow, TextField, Input, Label } from "@heroui/react";

import {
  EMOJI_GROUPS,
  searchReactionEmojis,
  type ReactionEmoji,
} from "./reactionEmojis";

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelected: (emoji: string) => void;
}

/**
 * Full emoji picker for reactions. Rendered as a HeroUI modal sheet so it
 * works at every viewport size without a popover that can overflow the chat
 * column. No third-party emoji dependency — the catalogue and its search
 * keywords live in `reactionEmojis.ts`.
 */
export default function EmojiPicker({
  isOpen,
  onClose,
  onEmojiSelected,
}: EmojiPickerProps) {
  const [query, setQuery] = useState("");

  // Filter across all groups; a single flat grid once the user types.
  const filtered = useMemo(() => searchReactionEmojis(query), [query]);

  const handleSelect = (emoji: string) => {
    onEmojiSelected(emoji);
    setQuery("");
    onClose();
  };

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Modal.Backdrop variant="blur">
        <Modal.Container size="sm" placement="center" scroll="inside">
          <Modal.Dialog className="flex max-h-[80vh] flex-col">
            <Modal.Header>
              <Modal.Heading>Pick a reaction</Modal.Heading>
            </Modal.Header>

            <Modal.Body className="flex min-h-0 flex-col gap-3 py-2">
              <TextField
                type="search"
                value={query}
                onChange={setQuery}
                className="w-full"
              >
                <Label className="sr-only">Search emoji</Label>
                <Input placeholder="Search emoji…" className="rounded-xl" />
              </TextField>

              <ScrollShadow
                className="min-h-0 flex-1 overflow-y-auto"
                visibility="none"
              >
                {filtered.length > 0 || query.trim() ? (
                  filtered.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No emoji found.
                    </p>
                  ) : (
                    <div className="grid grid-cols-8 gap-1">
                      {filtered.map((item) => (
                        <EmojiButton
                          key={item.emoji}
                          emoji={item.emoji}
                          onSelect={handleSelect}
                        />
                      ))}
                    </div>
                  )
                ) : (
                  <div className="flex flex-col gap-4">
                    {EMOJI_GROUPS.map((group) => (
                      <div key={group.label}>
                        <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {group.label}
                        </p>
                        <div className="grid grid-cols-8 gap-1">
                          {group.emojis.map((item: ReactionEmoji) => (
                            <EmojiButton
                              key={item.emoji}
                              emoji={item.emoji}
                              onSelect={handleSelect}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollShadow>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function EmojiButton({
  emoji,
  onSelect,
}: {
  emoji: string;
  onSelect: (emoji: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(emoji)}
      aria-label={`React with ${emoji}`}
      className="rounded-lg p-1.5 text-2xl leading-8 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {emoji}
    </button>
  );
}