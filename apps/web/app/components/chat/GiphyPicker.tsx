"use client";

import { useEffect, useState } from "react";
import { Input, Label, Modal, ScrollShadow, Spinner, TextField } from "@heroui/react";

import { fetchGiphyGifs, type GiphyGif } from "./giphy";

interface GiphyPickerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Fires with the CDN URL, which is stored verbatim on the chat row. */
  onGifSelected: (url: string) => void;
}

/**
 * GIF search sheet for the composer. Trending on open, live search on typing,
 * and a click sends immediately — the chosen GIF is the whole message, so
 * there's nothing to stage or caption.
 */
export default function GiphyPicker({
  isOpen,
  onClose,
  onGifSelected,
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
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Modal.Backdrop variant="blur">
        <Modal.Container size="md" placement="center" scroll="inside">
          <Modal.Dialog className="flex max-h-[80vh] flex-col">
            <Modal.Header>
              <Modal.Heading>Send a GIF</Modal.Heading>
            </Modal.Header>

            <Modal.Body className="flex min-h-0 flex-col gap-3 py-2">
              <TextField
                type="search"
                value={query}
                onChange={setQuery}
                className="w-full"
              >
                <Label className="sr-only">Search GIFs</Label>
                <Input placeholder="Search GIFs…" className="rounded-xl" />
              </TextField>

              <ScrollShadow
                className="min-h-0 flex-1 overflow-y-auto"
                visibility="none"
              >
                {isLoading ? (
                  <div className="flex justify-center py-10">
                    <Spinner size="md" color="accent" />
                  </div>
                ) : gifs.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    {query.trim()
                      ? "No GIFs found."
                      : "GIF search is unavailable right now."}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {gifs.map((gif) => (
                      <button
                        key={gif.id}
                        type="button"
                        onClick={() => handleSelect(gif.url)}
                        aria-label={gif.title || "Send GIF"}
                        className="overflow-hidden rounded-xl border border-border transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                      </button>
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