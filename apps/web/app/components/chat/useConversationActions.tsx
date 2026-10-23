"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@heroui/react";
import { createClient } from "@repo/supabase/browser";
import type { UserReportReason } from "@repo/utils";

import RemovePhotoConfirmModal from "@/app/components/profile/RemovePhotoConfirmModal";
import { conversationApartmentHref } from "@/lib/conversation-context";
import type { ConversationContact } from "@/lib/conversation-contacts";
import {
  applyPreferenceChange,
  hasUnreadContact,
  type ConversationMenuAction,
  type ConversationPreferenceChange,
} from "@/lib/conversation-list";
import ReportUserModal from "./ReportUserModal";
import { markConversationRead, reportUser, setConversationPreference, setUserBlocked } from "./conversationActions";

/** What a row's menu has changed locally on top of the server's lists. */
type Overlay = Partial<Pick<ConversationContact, "isPinned" | "pinnedAt" | "isArchived" | "isMuted" | "markedUnread" | "blockedByMe">>;

function errorMessage(error: unknown): string {
  const message = (error as { message?: unknown } | null)?.message;
  return typeof message === "string" && message.trim() ? message : "Something went wrong. Try again.";
}

const firstName = (contact: ConversationContact) => contact.name.split(" ")[0] || "this person";

/**
 * The Messages list actions (mobile's `useConversationRowActions`): pin,
 * archive, read state, mute, view apartment, report and block. Changes show at
 * once (kept as an overlay on the server's lists) and roll back with an error
 * toast if the database refuses. Render `dialogs` once beside the list.
 */
export function useConversationActions(portal: "tenant" | "landlord", onMarkedRead?: (conversationKey: string) => void) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [overlay, setOverlay] = useState<Record<string, Overlay>>({});
  const [reportTarget, setReportTarget] = useState<ConversationContact | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [blockTarget, setBlockTarget] = useState<ConversationContact | null>(null);
  const [isBlocking, setIsBlocking] = useState(false);

  const withOverlay = useCallback(
    <T extends ConversationContact>(contacts: readonly T[]): T[] =>
      contacts.map((contact) => (overlay[contact.conversationKey] ? { ...contact, ...overlay[contact.conversationKey] } : contact)),
    [overlay]
  );

  const patch = useCallback((key: string, change: Overlay | null) => {
    setOverlay((prev) => {
      const next = { ...prev };
      if (change === null) delete next[key];
      else next[key] = { ...prev[key], ...change };
      return next;
    });
  }, []);

  const failed = useCallback((title: string, error: unknown) => {
    console.error(`[conversations] ${title}:`, error);
    toast.danger(`${title}. ${errorMessage(error)}`);
  }, []);

  const runPreferenceChange = useCallback(
    async (contact: ConversationContact, change: ConversationPreferenceChange, successLabel: string) => {
      const key = contact.conversationKey;
      const previous = overlay[key] ?? null;
      const applied = applyPreferenceChange(contact, change);
      patch(key, { isPinned: applied.isPinned, pinnedAt: applied.pinnedAt, isArchived: applied.isArchived, isMuted: applied.isMuted, markedUnread: applied.markedUnread });
      try {
        await setConversationPreference(supabase, { otherUserId: contact.id, apartmentId: contact.apartmentId }, change);
        toast.success(successLabel);
      } catch (error) {
        setOverlay((prev) => {
          const next = { ...prev };
          if (previous) next[key] = previous;
          else delete next[key];
          return next;
        });
        failed("Couldn't update this chat", error);
      }
    },
    [failed, overlay, patch, supabase]
  );

  const markRead = useCallback(
    async (contact: ConversationContact) => {
      const key = contact.conversationKey;
      // The caller zeroes the unread count in its own state; the overlay only owns the manual flag.
      patch(key, { markedUnread: false });
      onMarkedRead?.(key);
      try {
        await markConversationRead(supabase, { otherUserId: contact.id, apartmentId: contact.apartmentId });
      } catch (error) {
        patch(key, { markedUnread: contact.markedUnread ?? false });
        failed("Couldn't mark as read", error);
      }
    },
    [failed, onMarkedRead, patch, supabase]
  );

  const setBlocked = useCallback(
    async (contact: ConversationContact, blocked: boolean) => {
      setIsBlocking(true);
      try {
        await setUserBlocked(supabase, contact.id, blocked);
        patch(contact.conversationKey, { blockedByMe: blocked });
        toast.success(blocked ? `${firstName(contact)} blocked` : `${firstName(contact)} unblocked`);
        setBlockTarget(null);
      } catch (error) {
        failed(blocked ? "Couldn't block" : "Couldn't unblock", error);
      } finally {
        setIsBlocking(false);
      }
    },
    [failed, patch, supabase]
  );

  const onMenuAction = useCallback(
    (action: ConversationMenuAction, contact: ConversationContact, pinLocked: boolean) => {
      switch (action) {
        case "togglePin": {
          if (pinLocked) return;
          const isPinned = !contact.isPinned;
          void runPreferenceChange(contact, { isPinned }, isPinned ? "Chat pinned" : "Chat unpinned");
          return;
        }
        case "toggleArchive": {
          if (pinLocked) return;
          const isArchived = !contact.isArchived;
          void runPreferenceChange(contact, { isArchived }, isArchived ? "Chat archived" : "Chat moved back to Messages");
          return;
        }
        case "toggleRead":
          if (hasUnreadContact(contact)) void markRead(contact);
          else void runPreferenceChange(contact, { markedUnread: true }, "Marked as unread");
          return;
        case "viewApartment":
          if (contact.apartmentId) router.push(conversationApartmentHref(contact.apartmentId, portal));
          return;
        case "toggleMute": {
          const isMuted = !contact.isMuted;
          void runPreferenceChange(contact, { isMuted }, isMuted ? "Notifications muted" : "Notifications unmuted");
          return;
        }
        case "report":
          setReportError(null);
          setReportTarget(contact);
          return;
        case "toggleBlock":
          if (contact.blockedByMe) void setBlocked(contact, false);
          else setBlockTarget(contact);
          return;
      }
    },
    [markRead, portal, router, runPreferenceChange, setBlocked]
  );

  const submitReport = useCallback(
    async (reason: UserReportReason, details: string) => {
      if (!reportTarget) return;
      setIsReporting(true);
      setReportError(null);
      try {
        await reportUser(supabase, { target: { otherUserId: reportTarget.id, apartmentId: reportTarget.apartmentId }, reason, details });
        toast.success("Report sent. Thanks for letting us know.");
        setReportTarget(null);
      } catch (error) {
        console.error("[conversations] Failed to report:", error);
        setReportError(errorMessage(error));
      } finally {
        setIsReporting(false);
      }
    },
    [reportTarget, supabase]
  );

  const dialogs: ReactNode = (
    <>
      <ReportUserModal
        name={reportTarget ? firstName(reportTarget) : null}
        isSubmitting={isReporting}
        error={reportError}
        onClose={() => setReportTarget(null)}
        onSubmit={(reason, details) => void submitReport(reason, details)}
      />
      <RemovePhotoConfirmModal
        isOpen={blockTarget !== null}
        title={`Block ${blockTarget ? firstName(blockTarget) : ""}?`}
        description="They won't be able to message you, and you won't be able to message them. You can unblock them anytime."
        confirmLabel="Block"
        pendingLabel="Blocking..."
        isRemoving={isBlocking}
        onClose={() => setBlockTarget(null)}
        onConfirm={() => blockTarget && void setBlocked(blockTarget, true)}
      />
    </>
  );

  return { withOverlay, onMenuAction, dialogs };
}
