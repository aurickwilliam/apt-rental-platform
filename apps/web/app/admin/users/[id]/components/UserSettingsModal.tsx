"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconBell,
  IconLock,
  IconRefresh,
  IconSettings,
  IconShieldCheck,
  IconUser,
} from "@tabler/icons-react";
import { Button, Chip, Modal, TextArea } from "@heroui/react";

import { setUserAccess } from "../../../actions/operations";
import {
  formatRoles,
  getFullName,
  joinedFormatter,
  verificationChipColor,
  type AdminUserDetail,
} from "../../lib/user-display";
import type { UserActivityEvent } from "./UserActivityTimeline";
import type { UserVerificationItem } from "./UserVerificationCard";

type SettingsTab = "account" | "security" | "notifications" | "actions";

interface UserSettingsModalProps {
  user: AdminUserDetail;
  verifications: UserVerificationItem[];
  activityEvents: UserActivityEvent[];
  suspensionSupported: boolean;
  initialOpen?: boolean;
  showTrigger?: boolean;
  closeHref?: string;
}

const tabs: Array<{
  id: SettingsTab;
  label: string;
  icon: typeof IconUser;
}> = [
  { id: "account", label: "Account", icon: IconUser },
  { id: "security", label: "Security & verification", icon: IconShieldCheck },
  { id: "notifications", label: "Notifications", icon: IconBell },
  { id: "actions", label: "Account actions", icon: IconLock },
];

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground wrap-break-word">{value}</p>
    </div>
  );
}

export default function UserSettingsModal({
  user,
  verifications,
  activityEvents,
  suspensionSupported,
  initialOpen = false,
  showTrigger = true,
  closeHref,
}: UserSettingsModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [reason, setReason] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const latestVerification = verifications[0] ?? null;
  const canChangeAccess = suspensionSupported && !user.roles.includes("admin");
  const accessAction = user.is_suspended ? "reactivate" : "suspend";
  const actionLabel = user.is_suspended ? "Reactivate account" : "Suspend account";

  const close = () => {
    if (isPending) return;
    setIsOpen(false);
    setActiveTab("account");
    setReason("");
    setIsConfirming(false);
    setError(null);
    if (closeHref) router.replace(closeHref);
  };

  const submitAccessChange = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (reason.trim().length < 3) {
      setError("Enter a reason of at least 3 characters.");
      return;
    }
    if (!isConfirming) {
      setError(null);
      setIsConfirming(true);
      return;
    }

    const formData = new FormData();
    formData.set("id", user.id);
    formData.set("decision", accessAction);
    formData.set("reason", reason.trim());
    startTransition(async () => {
      try {
        const result = await setUserAccess(formData);
        if (result.error) {
          setError(result.error);
          return;
        }
        close();
        router.refresh();
      } catch (submitError) {
        console.error("Admin account access update failed", submitError);
        setError("Account access could not be updated. Refresh and try again.");
      }
    });
  };

  return (
    <>
      {showTrigger ? (
        <Button variant="outline" onPress={() => setIsOpen(true)}>
          <IconSettings size={18} aria-hidden="true" />
          Manage account
        </Button>
      ) : null}

      <Modal isOpen={isOpen} onOpenChange={(open) => (open ? setIsOpen(true) : close())}>
        <Modal.Backdrop>
          <Modal.Container placement="center" size="lg" scroll="inside" className="w-full max-w-5xl sm:w-full">
            <Modal.Dialog className="h-[calc(100dvh-2rem)] w-full max-w-5xl! overflow-hidden rounded-3xl bg-card p-0 md:h-[85dvh]">
              <Modal.CloseTrigger aria-label="Close account settings" className="text-foreground" />
              <Modal.Header className="shrink-0 border-b border-border px-5 py-4 pr-12">
                <div>
                  <Modal.Heading className="font-nunito text-xl font-bold">
                    Manage {getFullName(user)}
                  </Modal.Heading>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Review account details and apply access controls.
                  </p>
                </div>
              </Modal.Header>

              <Modal.Body className="mt-0! min-h-0 overflow-hidden! p-0 text-foreground">
                <div className="flex h-full min-h-0 flex-col md:flex-row">
                  <nav
                    aria-label="Account settings sections"
                    className="flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-muted/40 p-3 md:w-52 md:flex-col md:overflow-x-hidden md:overflow-y-auto md:border-r md:border-b-0"
                    role="tablist"
                    aria-orientation="vertical"
                  >
                    {tabs.map(({ id, label, icon: Icon }) => {
                      const selected = activeTab === id;
                      return (
                        <button
                          key={id}
                          id={`user-settings-tab-${id}`}
                          type="button"
                          role="tab"
                          aria-selected={selected}
                          aria-controls={`user-settings-panel-${id}`}
                          onClick={() => setActiveTab(id)}
                          className={`flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            selected
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-background hover:text-foreground"
                          }`}
                        >
                          <Icon size={18} aria-hidden="true" />
                          {label}
                        </button>
                      );
                    })}
                  </nav>

                  <section
                    id={`user-settings-panel-${activeTab}`}
                    role="tabpanel"
                    aria-labelledby={`user-settings-tab-${activeTab}`}
                    className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5"
                  >
                    {activeTab === "account" ? (
                      <div className="space-y-4">
                        <div>
                          <h2 className="font-nunito text-lg font-bold text-foreground">Account</h2>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Identity and role details are read-only for administrators.
                          </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <DetailItem label="Full name" value={getFullName(user)} />
                          <DetailItem label="Email" value={user.email ?? "Not provided"} />
                          <DetailItem label="Mobile" value={user.mobile_number ?? "Not provided"} />
                          <DetailItem label="Roles" value={formatRoles(user.roles)} />
                          <DetailItem label="Account status" value={user.account_status} />
                          <DetailItem
                            label="Joined"
                            value={joinedFormatter.format(new Date(user.created_at))}
                          />
                        </div>
                      </div>
                    ) : null}

                    {activeTab === "security" ? (
                      <div className="space-y-4">
                        <div>
                          <h2 className="font-nunito text-lg font-bold text-foreground">Security &amp; verification</h2>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Passwords and sign-in credentials are never exposed to administrators.
                          </p>
                        </div>
                        <div className="rounded-2xl border border-border p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold text-foreground">Identity verification</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {latestVerification
                                  ? `${latestVerification.id_type} · submitted ${joinedFormatter.format(new Date(latestVerification.submitted_at))}`
                                  : "No verification submission"}
                              </p>
                            </div>
                            <Chip
                              size="sm"
                              variant="soft"
                              color={verificationChipColor(latestVerification?.status ?? user.account_status)}
                              className="capitalize"
                            >
                              {latestVerification?.status ?? user.account_status}
                            </Chip>
                          </div>
                          {latestVerification ? (
                            <Link
                              href={`/admin/verification/users/${latestVerification.id}`}
                              className="mt-4 inline-block text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                              View verification record
                            </Link>
                          ) : null}
                        </div>
                        <div className="rounded-2xl border border-border p-4">
                          <p className="font-semibold text-foreground">Account access</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {user.is_suspended
                              ? `Suspended${user.suspension_reason ? ` — ${user.suspension_reason}` : ""}`
                              : "Active"}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {activeTab === "notifications" ? (
                      <div className="space-y-4">
                        <div>
                          <h2 className="font-nunito text-lg font-bold text-foreground">Notifications</h2>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Notification delivery is controlled by the account holder.
                          </p>
                        </div>
                        <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm">
                          <p className="font-semibold text-foreground">Private account preference</p>
                          <p className="mt-1 text-muted-foreground">
                            Current access policies do not allow administrators to view or change this user&apos;s notification preferences.
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {activeTab === "actions" ? (
                      <div className="space-y-4">
                        <div>
                          <h2 className="font-nunito text-lg font-bold text-foreground">Account actions</h2>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Access changes require a reason and are recorded in the admin audit log.
                          </p>
                        </div>

                        {canChangeAccess ? (
                          <form onSubmit={submitAccessChange} className="rounded-2xl border border-border p-4">
                            <div className="flex items-start gap-3">
                              {user.is_suspended ? (
                                <IconRefresh size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                              ) : (
                                <IconLock size={20} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
                              )}
                              <div>
                                <p className="font-semibold text-foreground">{actionLabel}</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                  {user.is_suspended
                                    ? "Allow this user to sign in and access protected data again."
                                    : "Block future sign-ins and revoke refreshable sessions. Existing access tokens remain valid until expiry."}
                                </p>
                              </div>
                            </div>
                            <div className="mt-4">
                              <label htmlFor="account-access-reason" className="text-sm font-semibold">
                                Reason <span className="text-danger">*</span>
                              </label>
                              <TextArea
                                id="account-access-reason"
                                value={reason}
                                onChange={(event) => {
                                  setReason(event.target.value);
                                  setIsConfirming(false);
                                }}
                                placeholder="Explain this account access change…"
                                minLength={3}
                                maxLength={500}
                                required
                                className="mt-2 w-full bg-card! text-foreground!"
                              />
                            </div>
                            {isConfirming ? (
                              <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm">
                                Confirm that you want to {accessAction} this account. This action will be added to the audit log.
                              </div>
                            ) : null}
                            {error ? <p role="alert" className="mt-3 text-sm text-danger">{error}</p> : null}
                            <div className="mt-4 flex flex-wrap gap-2">
                              {isConfirming ? (
                                <Button type="button" variant="outline" onPress={() => setIsConfirming(false)} isDisabled={isPending}>
                                  Cancel
                                </Button>
                              ) : null}
                              <Button type="submit" variant={user.is_suspended ? "primary" : "danger"} isPending={isPending}>
                                {isConfirming ? `Confirm ${accessAction}` : actionLabel}
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                            {suspensionSupported
                              ? "Administrative accounts cannot have access changed from this screen."
                              : "Account suspension is unavailable until the phase-2 admin operations migration is applied."}
                          </div>
                        )}

                        <div>
                          <h3 className="font-nunito text-base font-bold">Recent account actions</h3>
                          {activityEvents.length ? (
                            <ul className="mt-3 space-y-2">
                              {activityEvents.slice(0, 5).map((event) => (
                                <li key={event.id} className="rounded-xl border border-border p-3 text-sm">
                                  <p className="font-medium">{event.action.replaceAll("_", " ")}</p>
                                  <p className="mt-1 text-muted-foreground">
                                    {event.admin_name} · {joinedFormatter.format(new Date(event.created_at))}
                                    {event.reason ? ` — ${event.reason}` : ""}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-2 text-sm text-muted-foreground">No recorded account actions.</p>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </section>
                </div>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
