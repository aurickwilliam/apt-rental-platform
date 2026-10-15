"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button, Input } from "@heroui/react";
import {
  IconMoodSmile,
  IconPaperclip,
  IconPhotoPlus,
  IconSend,
  IconX,
} from "@tabler/icons-react";

import EmojiInsertPanel from "./EmojiInsertPanel";
import GiphyPickerSheet from "./GiphyPickerSheet";
import {
  MAX_ATTACHMENTS_PER_MESSAGE,
  generateAttachmentId,
  resolveMessageType,
  validateAttachmentFile,
  type StagedAttachment,
} from "./attachments";
import type { ChatMessage } from "./types";

interface MessageInputProps {
  onSend?: (message: string) => void;
  onTypingChange?: (isTyping: boolean) => void;
  /** Uploads and sends the staged files as one batch. */
  onSendAttachments?: (staged: StagedAttachment[]) => void | Promise<void>;
  /** Sends the Giphy CDN URL verbatim. */
  onSendGif?: (url: string) => void | Promise<void>;
  replyTarget?: ChatMessage | null;
  /** Who the reply targets, e.g. "Charlie" or "your message". */
  replyLabel?: string;
  onClearReply?: () => void;
  /** User-facing message for a rejected file. */
  onError?: (message: string) => void;
}

/**
 * The conversation composer: text, emoji insertion, GIF search and staged
 * image/video attachments.
 *
 * Attachments are staged rather than sent on pick, so several files can be
 * combined into one batch and reviewed before anything leaves the device. GIFs
 * are the exception — a chosen GIF is the whole message, so it sends at once.
 */
export default function MessageInput({
  onSend,
  onTypingChange,
  onSendAttachments,
  onSendGif,
  replyTarget,
  replyLabel,
  onClearReply,
  onError,
}: MessageInputProps) {
  const [value, setValue] = useState<string>("");
  const [staged, setStaged] = useState<StagedAttachment[]>([]);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isGiphyOpen, setIsGiphyOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Staged previews are object URLs, so they must be revoked when the item is
  // removed, replaced, or the composer unmounts — otherwise the blob stays in
  // memory for the life of the tab.
  const stagedRef = useRef<StagedAttachment[]>(staged);
  const emojiButtonRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    stagedRef.current = staged;
  }, [staged]);

  /**
   * Keeps a press from moving focus off the draft.
   *
   * A native button's default `mousedown` focuses the button, which blurs the
   * input — on a mobile browser that collapses the keyboard mid-sentence, and
   * it discards the caret the insert step needs. Suppressing the default keeps
   * the caret, the keyboard and any in-progress draft selection alive.
   */
  const preventFocusSteal = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // A press on the toggle belongs to the toggle, not to the panel's click-away
  // closer — otherwise opening re-closes and the panel flickers.
  useEffect(() => {
    if (!isEmojiOpen) return;
    const button = emojiButtonRef.current;
    if (!button) return;
    const swallow = (event: MouseEvent) => {
      event.stopPropagation();
      if (event.target instanceof Node && button.contains(event.target)) {
        setIsEmojiOpen(false);
      }
    };
    button.addEventListener("mousedown", swallow);
    return () => button.removeEventListener("mousedown", swallow);
  }, [isEmojiOpen]);

  useEffect(() => {
    return () => {
      for (const item of stagedRef.current) URL.revokeObjectURL(item.previewUrl);
    };
  }, []);

  const setTyping = useCallback((typing: boolean) => {
    if (typing === isTypingRef.current) return;
    isTypingRef.current = typing;
    onTypingChange?.(typing);
  }, [onTypingChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);

    if (e.target.value.trim()) {
      setTyping(true);
      // Reset the stop-typing timer on every keystroke
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTyping(false), 2000);
    } else {
      setTyping(false);
    }
  };

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTyping(false);
  }, [setTyping]);

  // Ensure typing stops if the component unmounts mid-type
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // Focus the composer when a reply is started, like mobile's reply flow.
  useEffect(() => {
    if (replyTarget) inputRef.current?.focus();
  }, [replyTarget]);

  /** Inserts an emoji at the caret, replacing any selection. */
  const insertEmoji = useCallback((emoji: string) => {
    const input = inputRef.current;
    setValue((current) => {
      const start = input?.selectionStart ?? current.length;
      const end = input?.selectionEnd ?? current.length;
      return `${current.slice(0, start)}${emoji}${current.slice(end)}`;
    });

    // The panel deliberately stays open so several emoji can be picked in a
    // row — that is the point of a picker over a send-and-close flow.
    // Restore the caret after the insert, once React has committed the value.
    requestAnimationFrame(() => {
      const field = inputRef.current;
      if (!field) return;
      const caret =
        (input?.selectionStart ?? field.value.length) + emoji.length;
      field.focus();
      field.setSelectionRange(caret, caret);
    });
  }, []);

  /**
   * Opens or closes the emoji panel.
   *
   * The button is a sibling of the panel, so the panel's click-away handler
   * sees this press on `mousedown` and would close it a moment before the
   * `click` here runs — so the toggle skips that race by flipping on the
   * button's own `mousedown` instead, and this `click` becomes a no-op.
   */
  const toggleEmojiPanel = useCallback(() => {
    if (isEmojiOpen) return;
    setIsEmojiOpen(true);
  }, [isEmojiOpen]);

  const removeStaged = useCallback((id: string) => {
    setStaged((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const handleFilesPicked = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const picked = Array.from(files);
      const accepted: StagedAttachment[] = [];
      const rejected: string[] = [];

      for (const file of picked) {
        const problem = await validateAttachmentFile(file);
        if (problem) {
          rejected.push(problem);
          continue;
        }
        accepted.push({
          id: generateAttachmentId(),
          file,
          previewUrl: URL.createObjectURL(file),
          messageType: resolveMessageType(file.type),
          mimeType: file.type,
        });
      }

      if (accepted.length > 0) {
        setStaged((prev) => {
          // Cap the batch; anything past the limit is dropped with a reason
          // rather than silently.
          const room = Math.max(0, MAX_ATTACHMENTS_PER_MESSAGE - prev.length);
          const kept = accepted.slice(0, room);
          for (const extra of accepted.slice(room)) {
            URL.revokeObjectURL(extra.previewUrl);
            rejected.push(
              `"${extra.file.name}" — up to ${MAX_ATTACHMENTS_PER_MESSAGE} files per message.`
            );
          }
          return [...prev, ...kept];
        });
      }

      if (rejected.length > 0) onError?.(rejected.join(" "));
    },
    [onError]
  );

  const canSend = Boolean(value.trim()) || staged.length > 0;

  const handleSend = useCallback((): void => {
    if (isSending) return;

    const text = value.trim();
    if (!text && staged.length === 0) return;

    stopTyping();

    // Attachments take precedence when both are present, so a batch is never
    // sent as two separate messages by accident.
    if (staged.length > 0) {
      const batch = staged;
      setStaged([]);
      setValue("");
      setIsSending(true);
      void Promise.resolve(onSendAttachments?.(batch)).finally(() => {
        setIsSending(false);
      });
      return;
    }

    onSend?.(text);
    setValue("");
  }, [isSending, onSend, onSendAttachments, staged, stopTyping, value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleGifSelected = useCallback(
    (url: string) => {
      stopTyping();
      void onSendGif?.(url);
    },
    [onSendGif, stopTyping]
  );

  const iconButtonClass =
    "flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  return (
    // `relative` anchors the floating emoji panel above the composer. Without
    // it the panel can only be laid out in flow, which inflates the composer
    // and crushes the message thread.
    <div className="relative border-t border-border bg-card">
      {replyTarget && (
        <div className="mx-3 mt-2 flex items-start gap-2 rounded-xl border-l-4 border-primary bg-muted/60 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-primary">
              Replying to {replyLabel ?? "message"}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {replyTarget.message || "Attachment"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClearReply}
            aria-label="Cancel reply"
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <IconX size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {staged.length > 0 && (
        <div className="mx-3 mt-2 flex flex-wrap gap-2">
          {staged.map((item) => (
            <div
              key={item.id}
              className="group relative size-16 overflow-hidden rounded-xl border border-border bg-muted"
            >
              {item.messageType === "video" ? (
                <video
                  src={item.previewUrl}
                  preload="metadata"
                  muted
                  className="size-full object-cover"
                />
              ) : (
                // Local object URL — the file hasn't been uploaded yet.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="size-full object-cover"
                />
              )}
              <button
                type="button"
                onClick={() => removeStaged(item.id)}
                aria-label={`Remove ${item.file.name}`}
                className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <IconX size={12} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
          multiple
          className="hidden"
          onChange={(e) => {
            void handleFilesPicked(e.target.files);
            // Reset so re-picking the same file fires a change event.
            e.target.value = "";
          }}
        />

        <button
          type="button"
          className={iconButtonClass}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach photos or videos"
        >
          <IconPaperclip size={20} aria-hidden="true" />
        </button>

        <button
          type="button"
          className={iconButtonClass}
          onClick={() => setIsGiphyOpen(true)}
          aria-label="Send a GIF"
        >
          <IconPhotoPlus size={20} aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1">
          <Input
            ref={inputRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            fullWidth
            className="rounded-full"
            aria-label="Message"
          />
        </div>

        <button
          ref={emojiButtonRef}
          type="button"
          className={iconButtonClass}
          onMouseDown={preventFocusSteal}
          onClick={toggleEmojiPanel}
          aria-label="Insert emoji"
          aria-expanded={isEmojiOpen}
        >
          <IconMoodSmile size={20} aria-hidden="true" />
        </button>

        <Button
          className="px-6 font-medium"
          onPress={handleSend}
          isDisabled={!canSend || isSending}
          isPending={isSending}
          aria-label="Send message"
        >
          <IconSend size={18} aria-hidden="true" />
          Send
        </Button>
      </div>

      {isEmojiOpen && (
        <EmojiInsertPanel
          onSelect={insertEmoji}
          onClose={() => setIsEmojiOpen(false)}
        />
      )}

      {isGiphyOpen && (
        <GiphyPickerSheet
          onSelect={handleGifSelected}
          onClose={() => setIsGiphyOpen(false)}
        />
      )}
    </div>
  );
}