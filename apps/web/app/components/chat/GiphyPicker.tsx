"use client";

import { useEffect, useState, type RefObject } from "react";
import { Input, Label, Popover, ScrollShadow, Spinner, TextField, Button } from "@heroui/react";

import { fetchGiphyGifs, type GiphyGif } from "./giphy";

interface GiphyPickerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Fires with the CDN URL, which is stored verbatim on the chat row. */
  onGifSelected: (url: string) => void;
  /** The GIF button the menu opens above. */
  anchorRef: RefObject<HTMLElement | null>;
}

/**
 * GIF search menu for the composer, a HeroUI popover that opens above the GIF
 * button: a search box over a three-column grid. Trending on open, live search
 * on typing, and a click sends immediately — the chosen GIF is the whole
 * message, so there's nothing to stage or caption.
 */
export default function GiphyPicker({
  isOpen,
  onClose,
  onGifSelected,
  anchorRef,
}: GiphyPickerProps) {
  const [query, setQuery] = useState("");
  // Results are tagged with the query they were fetched for, so "loading" is
  // derived by comparison rather than stored — that keeps the effect body free
  // of setState, which `react-hooks/set-state-in-effect` forbids.
  const [results, setResults] = useState<{
    query: string;
    gifs: GiphyGif[];
  } | null>(null);

  const isLoading = results?.query !== query;
  const gifs = results?.query === query ? results.gifs : [];

  // Debounced so a fast typist doesn't fire a request per keystroke. The
  // cancellation flag drops a stale response that resolves after a newer one.
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      void fetchGiphyGifs(query).then((gifs) => {
        if (cancelled) return;
        setResults({ query, gifs });
      });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, query]);

  const handleClose = () => {
    setQuery("");
    setResults(null);
    onClose();
  };

  const handleSelect = (url: string) => {
    onGifSelected(url);
    handleClose();
  };

  return (
    <Popover isOpen={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Popover.Content
        triggerRef={anchorRef}
        // A press on the GIF button itself is handled by the button (it toggles the menu).
        shouldCloseOnInteractOutside={(element) => !anchorRef.current?.contains(element)}
        placement="top end"
        offset={8}
        containerPadding={12}
        className="flex w-[22rem] max-w-[calc(100vw-1.5rem)] flex-col"
      >
        <Popover.Dialog aria-label="Send a GIF" className="flex min-h-0 flex-1 flex-col gap-2 p-2">
          <TextField type="search" value={query} onChange={setQuery} className="w-full">
            <Label className="sr-only">Search GIFs</Label>
            <Input placeholder="Search GIFs…" className="rounded-xl" />
          </TextField>

          {/* Search + this grid add up to the emoji picker's 22rem, so the two menus match. */}
          <ScrollShadow className="h-72 min-h-0 shrink overflow-y-auto" visibility="none">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <Spinner size="md" color="accent" />
              </div>
            ) : gifs.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {query.trim() ? "No GIFs found." : "GIF search is unavailable right now."}
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {gifs.map((gif) => (
                  <Button
                    variant="ghost"
                    key={gif.id}
                    onClick={() => handleSelect(gif.url)}
                    aria-label={gif.title || "Send GIF"}
                    className="button--bare cursor-pointer overflow-hidden rounded-xl border border-border transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {/* External CDN URL — not a configured `next/image`
                        host, so plain `<img>` per the signed-URL
                        convention. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={gif.previewUrl}
                      alt={gif.title || "GIF"}
                      loading="lazy"
                      className="aspect-square w-full bg-muted object-cover"
                    />
                  </Button>
                ))}
              </div>
            )}
          </ScrollShadow>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
