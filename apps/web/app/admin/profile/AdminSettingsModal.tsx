"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  IconAccessible,
  IconBell,
  IconExternalLink,
  IconHelpCircle,
  IconInfoCircle,
  IconSettings,
  IconShieldLock,
} from "@tabler/icons-react";
import { Modal, Spinner, Switch } from "@heroui/react";
import { createClient } from "@repo/supabase/browser";
import {
  getReducedMotion,
  setReducedMotion,
  subscribeReducedMotion,
} from "@/lib/reduced-motion";

type Tab = "accessibility" | "security" | "notifications" | "support" | "about";
type NotificationKey =
  | "notifications_enabled"
  | "push_enabled"
  | "show_chat_toasts"
  | "payment"
  | "message"
  | "maintenance"
  | "apartment"
  | "system";
type NotificationPreferences = Record<NotificationKey, boolean>;

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  notifications_enabled: true,
  push_enabled: true,
  show_chat_toasts: false,
  payment: true,
  message: true,
  maintenance: true,
  apartment: true,
  system: true,
};

const TABS = [
  { id: "accessibility", label: "Accessibility", icon: IconAccessible },
  { id: "security", label: "Security & privacy", icon: IconShieldLock },
  { id: "notifications", label: "Notifications", icon: IconBell },
  { id: "support", label: "Support & Policy", icon: IconHelpCircle },
  { id: "about", label: "About", icon: IconInfoCircle },
] as const;

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SettingSwitch({
  label,
  selected,
  disabled = false,
  saving = false,
  onChange,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  saving?: boolean;
  onChange: (selected: boolean) => void;
}) {
  return (
    <Switch
      className={saving ? "settings-switch--saving" : undefined}
      isSelected={selected}
      isDisabled={disabled}
      onChange={onChange}
    >
      <Switch.Content aria-label={label}>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );
}

export default function AdminSettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    () => false,
  );
  const [tab, setTab] = useState<Tab>("accessibility");
  const [notifications, setNotifications] =
    useState<NotificationPreferences | null>(null);
  const [notificationError, setNotificationError] = useState<string | null>(
    null,
  );
  const [savingNotification, setSavingNotification] = useState(false);

  useEffect(() => {
    if (!open || tab !== "notifications") return;
    let cancelled = false;
    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (authError || !user) {
        setNotificationError(
          "Could not verify your session. Sign in again to manage notifications.",
        );
        return;
      }
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (cancelled) return;
      if (profileError || !profile) {
        setNotificationError(
          "Could not load your notification preferences. Try again later.",
        );
        return;
      }
      const { data, error } = await supabase
        .from("notification_preferences")
        .select(
          "notifications_enabled, push_enabled, show_chat_toasts, payment, message, maintenance, apartment, system",
        )
        .eq("user_id", profile.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error("Unable to load admin notification preferences", error);
        setNotificationError(
          "Could not load your notification preferences. Try again later.",
        );
        return;
      }
      setNotifications({ ...DEFAULT_NOTIFICATIONS, ...data });
      setNotificationError(null);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, tab]);

  const updateSystemNotification = async (value: boolean) => {
    if (!notifications || savingNotification) return;
    setSavingNotification(true);
    setNotificationError(null);
    const next = { ...notifications, system: value };
    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) throw authError ?? new Error("Not signed in");
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id")
        .eq("user_id", user.id)
        .single();
      if (profileError || !profile)
        throw profileError ?? new Error("Profile unavailable");
      const { error } = await supabase.from("notification_preferences").upsert(
        {
          user_id: profile.id,
          ...next,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
      setNotifications(next);
    } catch (error) {
      console.error("Unable to save admin notification preferences", error);
      setNotificationError("Could not save that preference. Try again.");
    } finally {
      setSavingNotification(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <Modal.Backdrop>
        <Modal.Container
          placement="center"
          size="lg"
          scroll="inside"
          className="w-full max-w-5xl sm:w-full"
        >
          <Modal.Dialog className="h-[calc(100dvh-2rem)] w-full max-w-5xl! overflow-hidden rounded-3xl bg-card p-0 md:h-[85dvh]">
            <Modal.CloseTrigger
              aria-label="Close settings"
              className="text-foreground"
            />
            <Modal.Header className="shrink-0 border-b border-border px-5 py-4 pr-12">
              <Modal.Heading className="font-nunito text-2xl text-primary font-bold flex flex-row items-center">
                <IconSettings
                  size={28}
                  className="mr-2 inline"
                  aria-hidden="true"
                />
                Settings
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="mt-0! min-h-0 overflow-hidden! p-0">
              <div className="flex h-full min-h-0 flex-col md:flex-row">
                <nav
                  aria-label="Settings sections"
                  className="flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-muted/40 p-3 md:w-52 md:flex-col md:overflow-x-hidden md:overflow-y-auto md:border-r md:border-b-0"
                >
                  {TABS.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      aria-current={tab === id ? "page" : undefined}
                      onClick={() => {
                        if (id === "notifications" && tab !== id) {
                          setNotifications(null);
                          setNotificationError(null);
                        }
                        setTab(id);
                      }}
                      className={`flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-background hover:text-foreground"}`}
                    >
                      <Icon size={18} aria-hidden="true" />
                      {label}
                    </button>
                  ))}
                </nav>
                <section
                  key={tab}
                  aria-label={TABS.find(({ id }) => id === tab)?.label}
                  className={`min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 ${tab === "notifications" ? "flex flex-col" : ""}`}
                >
                  {tab === "accessibility" ? (
                    <>
                      <h2 className="font-nunito text-lg font-bold text-primary">
                        Accessibility
                      </h2>
                      <div className="mt-3">
                        <SettingRow
                          label="Dark mode"
                          description="Use a darker color theme on this browser."
                        >
                          <SettingSwitch
                            label="Dark mode"
                            selected={resolvedTheme === "dark"}
                            onChange={(selected) =>
                              setTheme(selected ? "dark" : "light")
                            }
                          />
                        </SettingRow>
                        <SettingRow
                          label="Reduce motion"
                          description="Limit animations on this browser."
                        >
                          <SettingSwitch
                            label="Reduce motion"
                            selected={reduceMotion}
                            onChange={setReducedMotion}
                          />
                        </SettingRow>
                      </div>
                    </>
                  ) : null}
                  {tab === "security" ? (
                    <>
                      <h2 className="font-nunito text-lg font-bold text-primary">
                        Security &amp; privacy
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Manage your profile and review how your information is
                        handled.
                      </p>
                      <div className="mt-4 space-y-3">
                        <Link
                          href="/admin/profile/edit"
                          className="block rounded-xl border border-border p-4 text-sm font-semibold text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          Edit your profile{" "}
                          <IconExternalLink
                            size={16}
                            className="ml-1 inline"
                            aria-hidden="true"
                          />
                        </Link>
                        <div className="rounded-xl border border-border p-4 text-sm">
                          <p className="font-semibold">Password and email</p>
                          <p className="mt-1 text-muted-foreground">
                            Account credential changes are not available here
                            yet.
                          </p>
                        </div>
                        <Link
                          href="/pap"
                          className="block rounded-xl border border-border p-4 text-sm font-semibold text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          Privacy policy{" "}
                          <IconExternalLink
                            size={16}
                            className="ml-1 inline"
                            aria-hidden="true"
                          />
                        </Link>
                      </div>
                    </>
                  ) : null}
                  {tab === "notifications" ? (
                    <>
                      <h2 className="font-nunito text-lg font-bold text-primary">
                        Notifications
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Manage delivery of administrator verification alerts.
                      </p>
                      {notificationError ? (
                        <p role="alert" className="mt-3 text-sm text-danger">
                          {notificationError}
                        </p>
                      ) : null}
                      {notifications ? (
                        <div className="mt-3">
                          <SettingRow
                            label="Verification alerts"
                            description="Allow delivery of system alerts for new account and apartment verification submissions."
                          >
                            <SettingSwitch
                              label="Verification alerts"
                              selected={notifications.system}
                              disabled={savingNotification}
                              saving={savingNotification}
                              onChange={(value) =>
                                void updateSystemNotification(value)
                              }
                            />
                          </SettingRow>
                          <p className="mt-3 text-xs text-muted-foreground">
                            This controls mobile banner and push delivery where
                            available. Verification submissions still appear in
                            the admin queue.
                          </p>
                        </div>
                      ) : !notificationError ? (
                        <div
                          className="flex flex-1 items-center justify-center"
                          role="status"
                        >
                          <Spinner
                            size="lg"
                            color="current"
                            className="text-primary"
                            aria-label="Loading notification preferences"
                          />
                        </div>
                      ) : null}
                    </>
                  ) : null}
                  {tab === "support" ? (
                    <>
                      <h2 className="font-nunito text-lg font-bold text-primary">
                        Support &amp; Policy
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Need help or want to read our policies?
                      </p>
                      <div className="mt-4 space-y-3">
                        <a
                          href="mailto:support@apt-rental.ph"
                          className="block rounded-xl border border-border p-4 text-sm font-semibold text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          Report a problem · support@apt-rental.ph
                        </a>
                        <Link
                          href="/tos"
                          className="block rounded-xl border border-border p-4 text-sm font-semibold text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          Terms and conditions
                        </Link>
                        <Link
                          href="/pap"
                          className="block rounded-xl border border-border p-4 text-sm font-semibold text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          Privacy policy
                        </Link>
                        <Link
                          href="/cookies"
                          className="block rounded-xl border border-border p-4 text-sm font-semibold text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          Cookie policy
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          FAQs are not available on the web yet.
                        </p>
                      </div>
                    </>
                  ) : null}
                  {tab === "about" ? (
                    <>
                      <h2 className="font-nunito text-lg font-bold text-primary">
                        About
                      </h2>
                      <div className="mt-4 rounded-xl border border-border p-4">
                        <p className="font-nunito text-xl font-bold text-primary">
                          APT — A Place to Thrive
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Connecting renters and property owners in the
                          Philippines.
                        </p>
                        <p className="mt-3 text-xs text-muted-foreground">
                          APT web portal
                        </p>
                      </div>
                      <Link
                        href="/about"
                        className="mt-4 inline-block text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        Learn more about APT{" "}
                        <IconExternalLink
                          size={16}
                          className="ml-1 inline"
                          aria-hidden="true"
                        />
                      </Link>
                    </>
                  ) : null}
                </section>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
