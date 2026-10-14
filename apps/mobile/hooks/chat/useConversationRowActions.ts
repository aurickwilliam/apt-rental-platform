import { useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { useToast } from "heroui-native";

import { getChatApartmentRoute, getChatProfileRoute } from "@/service/chat/chatRoutes";
import { hasUnread } from "@/service/chat/conversationList";
import {
  reportUser,
  type ConversationPreferenceChange,
  type UserReportReason,
} from "@/service/chat/conversationActionsService";

import type {
  ConversationRole,
  ConversationWithMeta,
} from "@/service/chat/conversationService";

type MoreAction =
  | "togglePin"
  | "toggleArchive"
  | "toggleRead"
  | "viewProfile"
  | "viewApartment"
  | "toggleMute"
  | "report"
  | "toggleBlock";

interface ConversationRowActionsDeps {
  role: ConversationRole;
  markConversationRead: (conversationKey: string) => Promise<void>;
  updatePreferences: (
    conversation: ConversationWithMeta,
    change: ConversationPreferenceChange
  ) => Promise<void>;
  setBlocked: (otherUserId: string, blocked: boolean) => Promise<void>;
}

function getErrorMessage(error: unknown): string {
  const message = (error as { message?: unknown } | null)?.message;
  return typeof message === "string" && message.trim()
    ? message
    : "Something went wrong. Try again.";
}

function firstName(conversation: ConversationWithMeta): string {
  return conversation.other_user_name.split(" ")[0] || "this person";
}

/**
 * Swipe and "More" actions for a Messages list: pin, archive, read state,
 * mute, profile/apartment navigation, report and block. Owns the sheet and
 * dialog state; render `ConversationActionOverlays` with the result.
 */
export function useConversationRowActions({
  role,
  markConversationRead,
  updatePreferences,
  setBlocked,
}: ConversationRowActionsDeps) {
  const router = useRouter();
  const { toast } = useToast();

  const [moreTarget, setMoreTarget] = useState<ConversationWithMeta | null>(null);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isMorePinLocked, setIsMorePinLocked] = useState(false);
  const [reportTarget, setReportTarget] = useState<ConversationWithMeta | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [blockTarget, setBlockTarget] = useState<ConversationWithMeta | null>(null);
  const [blockError, setBlockError] = useState<string | null>(null);

  const runPreferenceChange = useCallback(
    async (
      conversation: ConversationWithMeta,
      change: ConversationPreferenceChange,
      successLabel: string
    ) => {
      try {
        await updatePreferences(conversation, change);
        toast.show({ variant: "success", label: successLabel });
      } catch (error) {
        console.error("[conversations] Failed to update conversation:", error);
        toast.show({
          variant: "danger",
          label: "Couldn't update this chat",
          description: getErrorMessage(error),
        });
      }
    },
    [toast, updatePreferences]
  );

  const openMore = useCallback(
    (conversation: ConversationWithMeta, { isPinLocked }: { isPinLocked: boolean }) => {
      setMoreTarget(conversation);
      setIsMorePinLocked(isPinLocked);
      setIsMoreOpen(true);
    },
    []
  );

  const togglePin = useCallback(
    (conversation: ConversationWithMeta) => {
      const pinned = !conversation.is_pinned;
      void runPreferenceChange(conversation, { pinned }, pinned ? "Chat pinned" : "Chat unpinned");
    },
    [runPreferenceChange]
  );

  const toggleArchive = useCallback(
    (conversation: ConversationWithMeta) => {
      const archived = !conversation.is_archived;
      void runPreferenceChange(
        conversation,
        { archived },
        archived ? "Chat archived" : "Chat moved back to Messages"
      );
    },
    [runPreferenceChange]
  );

  const openProfile = useCallback(
    (conversation: ConversationWithMeta) => {
      router.push(
        getChatProfileRoute(role, conversation.other_user_id, conversation.apartment_id ?? null)
      );
    },
    [role, router]
  );

  const openApartment = useCallback(
    (conversation: ConversationWithMeta) => {
      if (!conversation.apartment_id) return;
      router.push(getChatApartmentRoute(role, conversation.apartment_id));
    },
    [role, router]
  );

  const unblock = useCallback(
    async (conversation: ConversationWithMeta) => {
      try {
        await setBlocked(conversation.other_user_id, false);
        toast.show({ variant: "success", label: `${firstName(conversation)} unblocked` });
      } catch (error) {
        console.error("[conversations] Failed to unblock:", error);
        toast.show({
          variant: "danger",
          label: "Couldn't unblock",
          description: getErrorMessage(error),
        });
      }
    },
    [setBlocked, toast]
  );

  const selectMoreAction = useCallback(
    (action: MoreAction, conversation: ConversationWithMeta) => {
      setIsMoreOpen(false);

      switch (action) {
        case "togglePin":
          togglePin(conversation);
          return;
        case "toggleArchive":
          toggleArchive(conversation);
          return;
        case "toggleRead":
          if (hasUnread(conversation)) {
            void markConversationRead(conversation.conversation_key);
          } else {
            void runPreferenceChange(conversation, { markedUnread: true }, "Marked as unread");
          }
          return;
        case "viewProfile":
          openProfile(conversation);
          return;
        case "viewApartment":
          openApartment(conversation);
          return;
        case "toggleMute": {
          const muted = !conversation.is_muted;
          void runPreferenceChange(
            conversation,
            { muted },
            muted ? "Notifications muted" : "Notifications unmuted"
          );
          return;
        }
        case "report":
          setReportError(null);
          setReportTarget(conversation);
          return;
        case "toggleBlock":
          if (conversation.blocked_by_me) {
            void unblock(conversation);
          } else {
            setBlockError(null);
            setBlockTarget(conversation);
          }
          return;
      }
    },
    [
      markConversationRead,
      openApartment,
      openProfile,
      runPreferenceChange,
      toggleArchive,
      togglePin,
      unblock,
    ]
  );

  const submitReport = useCallback(
    async (reason: UserReportReason, details: string) => {
      if (!reportTarget) return;
      setIsReporting(true);
      setReportError(null);
      try {
        await reportUser({
          target: { otherUserId: reportTarget.other_user_id, apartmentId: reportTarget.apartment_id },
          reason,
          details,
        });
        setReportTarget(null);
        toast.show({
          variant: "success",
          label: "Report sent",
          description: "Thanks for letting us know. Our team will review it.",
        });
      } catch (error) {
        console.error("[conversations] Failed to report user:", error);
        // Database messages are written for users (e.g. already reported).
        setReportError(getErrorMessage(error));
      } finally {
        setIsReporting(false);
      }
    },
    [reportTarget, toast]
  );

  const confirmBlock = useCallback(async () => {
    if (!blockTarget) return;
    setBlockError(null);
    try {
      await setBlocked(blockTarget.other_user_id, true);
      toast.show({ variant: "success", label: `${firstName(blockTarget)} blocked` });
      setBlockTarget(null);
    } catch (error) {
      console.error("[conversations] Failed to block:", error);
      setBlockError(getErrorMessage(error));
    }
  }, [blockTarget, setBlocked, toast]);

  return {
    rowHandlers: { openMore, togglePin, toggleArchive },
    overlays: {
      moreTarget,
      isMoreOpen,
      isMorePinLocked,
      onMoreOpenChange: setIsMoreOpen,
      onSelectMoreAction: selectMoreAction,
      reportTarget,
      reportError,
      isReporting,
      onCloseReport: () => setReportTarget(null),
      onSubmitReport: submitReport,
      blockTarget,
      blockError,
      onCloseBlock: () => setBlockTarget(null),
      onConfirmBlock: confirmBlock,
    },
  };
}

export type ConversationActionOverlaysState = ReturnType<
  typeof useConversationRowActions
>["overlays"];
