"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input, Button, Tooltip } from "@heroui/react";
import {
  IconMoodSmile,
  IconSearch,
  IconX,
} from "@tabler/icons-react";

import { readEmojiRecents, rememberEmoji } from "./emojiRecents";
import {
  EMOJI_GROUPS,
  searchReactionEmojis,
  type ReactionEmoji,
} from "./reactionEmojis";

interface EmojiInsertPanelProps {
  /** Inserts the emoji at the caret in the composer draft. */
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

/**
 * Floating emoji picker for the composer.
 *
 * Deliberately an **overlay** rather than an in-flow block: rendered in the
 * normal document flow it inflated the composer to roughly half the viewport
 * and crushed the message thread, which broke the thread's scroll geometry.
 * Anchored above the composer it changes no layout at all, so opening the
 * picker never moves the message list. It is sized from the composer, not the
 * viewport (both edges inset, capped at 22rem), so it always fits a narrow
 * container such as the floating inquiry chat window.
 *
 * Layout follows the mobile panel: search, Recently Used, the grouped
 * catalogue, and a category jump bar that scrolls *this panel's own*
 * container — never the thread.
 */
export default function EmojiInsertPanel({
  onSelect,
  onClose,
}: EmojiInsertPanelProps) {
  const [query, setQuery] = useState("");
  // Read lazily rather than in an effect: the panel only ever mounts on a client
  // interaction, and a synchronous setState in an effect is disallowed here.
  const [recents, setRecents] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : readEmojiRecents()
  );
  const panelRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef(new Map<string, HTMLElement>());

  // Click-away and Escape close it. Capture phase: the toggle button lives
  // outside this overlay, so a bubble-phase listener would let the press that
  // opened it immediately close it again.
  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) onClose();
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  // Two branches, matching the catalogue's own shape: an empty bar browses
  // every group, and typing switches to a single flat grid of matches.
  // `searchReactionEmojis("")` returns nothing by design, so the grouped view
  // has to be rendered explicitly.
  const isBrowsing = query.trim().length === 0;
  const matches = useMemo(() => searchReactionEmojis(query), [query]);

  const handleSelect = (emoji: string) => {
    setRecents(rememberEmoji(emoji));
    onSelect(emoji);
  };

  /** Scrolls a category into view inside the panel, never the thread. */
  const jumpToCategory = (label: string) => {
    const section = sectionRefs.current.get(label);
    const scroller = scrollerRef.current;
    if (!section || !scroller) return;
    scroller.scrollTo({
      top: section.offsetTop - scroller.offsetTop,
      behavior: "smooth",
    });
  };

  // One representative glyph per category for the jump bar.
  const categoryIcons = useMemo(
    () =>
      EMOJI_GROUPS.map((group) => ({
        label: group.label,
        icon: group.emojis[0]?.emoji ?? "🙂",
      })),
    []
  );

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Insert emoji"
      className="absolute inset-x-2 bottom-full z-30 mb-2 flex max-h-[22rem] max-w-[22rem] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lg sm:inset-x-3"
    >
      <div className="flex items-center gap-1.5 border-b border-border px-2 py-2">
        <IconSearch size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search emoji"
          aria-label="Search emoji"
          className="min-w-0 flex-1"
        />
        <Button
          variant="ghost"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClose}
          aria-label="Close emoji picker"
          className="button--bare flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <IconX size={16} aria-hidden="true" />
        </Button>
      </div>

      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto p-2">
        {isBrowsing ? (
          <div className="flex flex-col gap-3">
            {recents.length > 0 && (
              <section>
                <h3 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recently Used
                </h3>
                <div className="grid grid-cols-8 gap-1">
                  {recents.map((emoji) => (
                    <EmojiButton
                      key={emoji}
                      emoji={emoji}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              </section>
            )}

            {EMOJI_GROUPS.map((group) => (
              <section
                key={group.label}
                ref={(el: HTMLElement | null) => {
                  if (el) sectionRefs.current.set(group.label, el);
                  else sectionRefs.current.delete(group.label);
                }}
              >
                <h3 className="mb-1 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </h3>
                <div className="grid grid-cols-8 gap-1">
                  {group.emojis.map((item: ReactionEmoji) => (
                    <EmojiButton
                      key={item.emoji}
                      emoji={item.emoji}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : matches.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No emoji found.
          </p>
        ) : (
          <div className="grid grid-cols-8 gap-1">
            {matches.map((item) => (
              <EmojiButton
                key={item.emoji}
                emoji={item.emoji}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </div>

      {/* Category jump bar — scrolls this panel only. */}
      <div className="flex items-center justify-between gap-0.5 border-t border-border bg-muted/40 px-1.5 py-1.5">
        <IconMoodSmile
          size={18}
          className="shrink-0 text-primary"
          aria-hidden="true"
        />
        {categoryIcons.map((category) => (
          <Tooltip key={category.label}>
            <Tooltip.Trigger>
              <Button
                variant="ghost"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => jumpToCategory(category.label)}
                aria-label={`Jump to ${category.label}`}
                className="button--bare flex size-7 shrink-0 items-center justify-center rounded-full text-lg leading-none transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {category.icon}
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>{category.label}</Tooltip.Content>
          </Tooltip>
        ))}
      </div>
    </div>
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
    <Button
      variant="ghost"
      // Keeps the caret in the composer: without this, picking an emoji blurs
      // the input, which on a mobile browser also collapses the keyboard, so
      // picking a second emoji would lose the insertion point.
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => onSelect(emoji)}
      aria-label={`Insert ${emoji}`}
      className="button--bare rounded-lg p-1 text-2xl leading-7 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {emoji}
    </Button>
  );
}