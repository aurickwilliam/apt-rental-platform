"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@repo/supabase/browser";
import { useUser } from "@/hooks/use-user";
import { toast } from "@heroui/react";
import { IconBell, IconBellRinging, IconMessageCircle } from "@tabler/icons-react";

import type { TranslationKey } from "@repo/i18n";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";

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
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
}[] = [
  {
    key: "notifications_enabled",
    icon: <IconBell size={20} aria-hidden="true" />,
    titleKey: "settings.notifications.inApp.title",
    descriptionKey: "settings.notifications.inApp.description",
  },
  {
    key: "push_enabled",
    icon: <IconBellRinging size={20} aria-hidden="true" />,
    titleKey: "settings.notifications.push.title",
    descriptionKey: "settings.notifications.push.description",
  },
  {
    key: "show_chat_toasts",
    icon: <IconMessageCircle size={20} aria-hidden="true" />,
    titleKey: "settings.notifications.chatToasts.title",
    descriptionKey: "settings.notifications.chatToasts.description",
  },
];

const NOTIFICATION_TYPE_KEYS: {
  type: keyof Omit<NotificationPreferences, GeneralToggleKey>;
  labelKey: TranslationKey;
}[] = [
  { type: "payment", labelKey: "settings.notifications.type.payment" },
  { type: "message", labelKey: "settings.notifications.type.message" },
  { type: "maintenance", labelKey: "settings.notifications.type.maintenance" },
  { type: "apartment", labelKey: "settings.notifications.type.apartment" },
  { type: "system", labelKey: "settings.notifications.type.system" },
];

export function useNotificationPreferences() {
  const { t } = useTranslation();
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
      toast.danger(t("settings.notifications.updateFailed"), {
        description: t("settings.notifications.retry"),
      });
    });
  }, [preferences, updatePrefs, t]);

  const toggleType = useCallback((type: keyof Omit<NotificationPreferences, GeneralToggleKey>) => {
    const previous = preferences;
    const next = { ...preferences, [type]: !preferences[type] };
    setPreferences(next);
    updatePrefs(next).catch((err) => {
      console.error("Failed to update notification preferences", err);
      setPreferences(previous);
      toast.danger(t("settings.notifications.updateFailed"), {
        description: t("settings.notifications.retry"),
      });
    });
  }, [preferences, updatePrefs, t]);

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
      toast.success(t("settings.notifications.resetDone"));
    } catch (err) {
      console.error("Failed to reset preferences", err);
      toast.danger(t("settings.notifications.resetFailed"), {
        description: t("settings.notifications.retry"),
      });
    }
  }, [userId, t]);

  return {
    preferences,
    loading,
    toggleGeneral,
    toggleType,
    resetToDefaults,
    GENERAL_TOGGLES: GENERAL_TOGGLES.map(({ key, icon, titleKey, descriptionKey }) => ({
      key,
      icon,
      title: t(titleKey),
      description: t(descriptionKey),
    })),
    NOTIFICATION_TYPE_LABELS: NOTIFICATION_TYPE_KEYS.map(({ type, labelKey }) => ({
      type,
      label: t(labelKey),
    })),
  };
}