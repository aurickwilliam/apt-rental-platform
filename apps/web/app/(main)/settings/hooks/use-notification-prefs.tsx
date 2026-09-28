"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@repo/supabase/browser";
import { useUser } from "@/hooks/use-user";
import { toast } from "@heroui/react";
import { Bell, BellRing, MessageSquare } from "lucide-react";

export interface NotificationPreferences {
  notifications_enabled: boolean;
  push_enabled: boolean;
  show_chat_toasts: boolean;
  payment: boolean;
  message: boolean;
  maintenance: boolean;
  apartment: boolean;
  system: boolean;
}

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  notifications_enabled: true,
  push_enabled: true,
  show_chat_toasts: false,
  payment: true,
  message: true,
  maintenance: true,
  apartment: true,
  system: true,
};

type GeneralToggleKey = "notifications_enabled" | "push_enabled" | "show_chat_toasts";

const GENERAL_TOGGLES: {
  key: GeneralToggleKey;
  icon: React.ReactNode;
  title: string;
  description: string;
}[] = [
  {
    key: "notifications_enabled",
    icon: <Bell className="w-5 h-5" />,
    title: "In-App Notifications",
    description: "Show banner notifications while using the app",
  },
  {
    key: "push_enabled",
    icon: <BellRing className="w-5 h-5" />,
    title: "Push Notifications",
    description: "Receive alerts on your device when the app is closed",
  },
  {
    key: "show_chat_toasts",
    icon: <MessageSquare className="w-5 h-5" />,
    title: "Message Toasts in Chat",
    description: "Show a banner for new messages in the chat you are viewing",
  },
];

const NOTIFICATION_TYPE_LABELS: { type: keyof Omit<NotificationPreferences, GeneralToggleKey>; label: string }[] = [
  { type: "payment", label: "Payments" },
  { type: "message", label: "Messages" },
  { type: "maintenance", label: "Maintenance" },
  { type: "apartment", label: "Apartments" },
  { type: "system", label: "System" },
];

export function useNotificationPreferences() {
  const { profile } = useUser();
  const userId = profile?.id ?? null;
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [loading, setLoading] = useState(true);

  // Inline fetch logic in effect to avoid set-state-in-effect warning
  useEffect(() => {
    let cancelled = false;

    async function fetchPrefs() {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
          .from("notification_preferences")
          .select("notifications_enabled, push_enabled, show_chat_toasts, payment, message, maintenance, apartment, system")
          .eq("user_id", userId)
          .maybeSingle();

        if (cancelled) return;
        if (error) throw error;

        setPreferences({ ...DEFAULT_NOTIFICATION_PREFERENCES, ...(data ?? {}) });
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to fetch notification preferences", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPrefs();
    return () => { cancelled = true; };
  }, [userId]);

  const updatePrefs = useCallback(async (next: NotificationPreferences) => {
    if (!userId) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("notification_preferences")
      .upsert(
        {
          user_id: userId,
          ...next,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (error) throw error;
  }, [userId]);

  const toggleGeneral = useCallback((key: GeneralToggleKey) => {
    const previous = preferences;
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    updatePrefs(next).catch((err) => {
      console.error("Failed to update notification preferences", err);
      setPreferences(previous);
      toast.danger("Failed to update", { description: "Try again." });
    });
  }, [preferences, updatePrefs]);

  const toggleType = useCallback((type: keyof Omit<NotificationPreferences, GeneralToggleKey>) => {
    const previous = preferences;
    const next = { ...preferences, [type]: !preferences[type] };
    setPreferences(next);
    updatePrefs(next).catch((err) => {
      console.error("Failed to update notification preferences", err);
      setPreferences(previous);
      toast.danger("Failed to update", { description: "Try again." });
    });
  }, [preferences, updatePrefs]);

  const resetToDefaults = useCallback(async () => {
    if (!userId) return;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("notification_preferences")
        .upsert(
          {
            user_id: userId,
            ...DEFAULT_NOTIFICATION_PREFERENCES,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

      if (error) throw error;

      setPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
      toast.success("Reset to defaults");
    } catch (err) {
      console.error("Failed to reset preferences", err);
      toast.danger("Couldn't reset", { description: "Try again." });
    }
  }, [userId]);

  return {
    preferences,
    loading,
    toggleGeneral,
    toggleType,
    resetToDefaults,
    GENERAL_TOGGLES,
    NOTIFICATION_TYPE_LABELS,
  };
}