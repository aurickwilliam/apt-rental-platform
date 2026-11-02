import { IconBan } from "@tabler/icons-react";

interface ChatBlockedNoticeProps {
  otherUserName: string;
  /** The current user blocked the other person (otherwise they were blocked). */
  blockedByMe: boolean;
}

/**
 * Floating card pinned to the bottom of the thread while either person has
 * blocked the other. It replaces the message box (mobile's `ChatBlockedNotice`);
 * render it inside the thread's relatively positioned pane.
 */
export default function ChatBlockedNotice({ otherUserName, blockedByMe }: ChatBlockedNoticeProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-x-4 bottom-4 z-20 mx-auto flex max-w-md flex-col items-center gap-1.5 rounded-2xl border border-border bg-card px-4 py-3 text-center shadow-lg"
    >
      <IconBan size={20} aria-hidden="true" className="text-muted-foreground" />
      <p className="text-sm font-semibold text-foreground">
        {blockedByMe ? `You blocked ${otherUserName}` : "You can't reply to this conversation"}
      </p>
      <p className="text-xs text-muted-foreground">
        {blockedByMe
          ? "You can't message each other until you unblock them."
          : "Messaging is unavailable in this conversation."}
      </p>
    </div>
  );
}
