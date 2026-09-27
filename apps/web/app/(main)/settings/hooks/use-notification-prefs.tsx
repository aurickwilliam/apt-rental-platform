import { useCallback, useEffect, useState } from "react";
import { createClient } from "@repo/supabase/browser";
import { useUser } from "@/hooks/use-user";
import { toast } from "@heroui/react";

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
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
    title: "In-App Notifications",
    description: "Show banner notifications while using the app",
  },
  {
    key: "push_enabled",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
    title: "Push Notifications",
    description: "Receive alerts on your device when the app is closed",
  },
  {
    key: "show_chat_toasts",
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
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
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPrefs = useCallback(async () => {
    if (!profile?.id) return;
    try {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("notifications_enabled, push_enabled, show_chat_toasts, payment, message, maintenance, apartment, system")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (error) throw error;

      setPreferences({ ...DEFAULT_NOTIFICATION_PREFERENCES, ...(data ?? {}) });
      setError(null);
    } catch (err) {
      console.error("Failed to fetch notification preferences", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch preferences"));
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  const updatePrefs = useCallback(async (next: NotificationPreferences) => {
    if (!profile?.id) return;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("notification_preferences")
        .upsert(
          {
            user_id: profile.id,
            ...next,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );

      if (error) throw error;
    } catch (err) {
      console.error("Failed to update notification preferences", err);
      toast.danger("Failed to update", { description: "Try again." });
      throw err;
    }
  }, [profile?.id]);

  const toggleGeneral = useCallback((key: GeneralToggleKey) => {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    updatePrefs(next);
  }, [preferences, updatePrefs]);

  const toggleType = useCallback((type: keyof Omit<NotificationPreferences, GeneralToggleKey>) => {
    const next = { ...preferences, [type]: !preferences[type] };
    setPreferences(next);
    updatePrefs(next);
  }, [preferences, updatePrefs]);

  const resetToDefaults = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("notification_preferences")
        .upsert(
          {
            user_id: profile.id,
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
  }, [profile?.id]);

  return {
    preferences,
    loading,
    error,
    toggleGeneral,
    toggleType,
    resetToDefaults,
    GENERAL_TOGGLES,
    NOTIFICATION_TYPE_LABELS,
  };
}