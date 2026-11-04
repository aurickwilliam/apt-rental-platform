"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button, Label, Modal, Radio, RadioGroup, TextArea, buttonVariants } from "@heroui/react";
import { IconBuilding, IconUser, IconX } from "@tabler/icons-react";
import { USER_REPORT_TARGET_LABELS } from "@repo/utils";

import StatusChip from "@/app/components/display/StatusChip";
import { SUSPENSION_DURATIONS } from "@/lib/suspension-duration";
import { REPORT_ACTION_LABELS, formatReportPerson, getReportReasonLabel } from "@/lib/user-reports";

import { actOnUserReport, resolveUserReport } from "../../actions/operations";
import { reportDateFormatter, reportStatusColor, type AdminUserReport } from "../lib/report-types";

type Decision = "warn" | "hide_listing" | "suspend_user" | "resolve" | "dismiss" | "restore_listing" | "keep_hidden";

interface DecisionOption {
  value: Decision;
  label: string;
  description: string;
  danger?: boolean;
  noteLabel: string;
  /** Only offered for a landlord's review request (and then only these). */
  reviewRequest?: boolean;
}

const DECISIONS: readonly DecisionOption[] = [
  {
    value: "warn",
    label: "Warn",
    description: "Send the reported person a warning with your message, then close the report.",
    noteLabel: "Warning message",
  },
  {
    value: "hide_listing",
    label: "Hide listing",
    description: "Remove the listing from search. The landlord can still see it. Closes the report.",
    danger: true,
    noteLabel: "Reason for hiding",
  },
  {
    value: "suspend_user",
    label: "Suspend account",
    description: "Block the account and sign it out everywhere, then close the report.",
    danger: true,
    noteLabel: "Reason for suspending",
  },
  {
    value: "restore_listing",
    label: "Restore listing",
    description: "Make the listing visible in search again and tell the landlord. Closes the request.",
    noteLabel: "Message to the landlord",
    reviewRequest: true,
  },
  {
    value: "keep_hidden",
    label: "Keep hidden",
    description: "Decline the request. The landlord is told why and can send another one after more changes.",
    danger: true,
    noteLabel: "What still needs fixing",
    reviewRequest: true,
  },
  {
    value: "resolve",
    label: "Resolve",
    description: "Close the report as handled, without warning, hiding or suspending anyone.",
    noteLabel: "Review note",
  },
  {
    value: "dismiss",
    label: "Dismiss",
    description: "Close the report as unfounded.",
    noteLabel: "Review note",
  },
];

const LINK_CLASSES = "font-semibold text-primary hover:underline";

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground wrap-break-word">{children}</dd>
    </div>
  );
}

interface ReportReviewModalProps {
  /** The report shown, or null when closed. */
  report: AdminUserReport | null;
  onClose: () => void;
}

/**
 * One place to read a report and decide: details on top, then a single action
 * and a note. A closed report shows the same details with what was decided.
 */
export default function ReportReviewModal({ report, onClose }: ReportReviewModalProps) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [duration, setDuration] = useState("permanent");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isOpenReport = report?.status === "open";
  const canHideListing =
    report?.target_type === "apartment" && Boolean(report.apartment) && !report.apartment?.is_hidden_by_admin;
  const isReviewRequest = report?.target_type === "review_request";
  const options = (isOpenReport ? DECISIONS : []).filter((option) => {
    if (Boolean(option.reviewRequest) !== isReviewRequest) return false;
    if (option.value === "hide_listing") return canHideListing;
    if (option.value === "suspend_user") return Boolean(report?.reported) && !report?.reported?.is_suspended;
    if (option.value === "warn") return Boolean(report?.reported);
    return true;
  });
  const selected = options.find((option) => option.value === decision) ?? null;
  const canSubmit = selected !== null && note.trim().length >= 3 && !pending;

  // The draft never outlives the dialog.
  function handleOpenChange(next: boolean) {
    if (pending || next) return;
    setDecision(null);
    setDuration("permanent");
    setNote("");
    setError(null);
    onClose();
  }

  function submit() {
    if (!selected || !report) return;
    const formData = new FormData();
    formData.set("id", report.id);
    formData.set("decision", selected.value);
    formData.set("reason", note.trim());
    if (selected.value === "suspend_user") formData.set("duration", duration);
    const action = selected.value === "resolve" || selected.value === "dismiss" ? resolveUserReport : actOnUserReport;

    startTransition(async () => {
      try {
        const result = await action(formData);
        if (result.error) {
          setError(result.error);
          return;
        }
        handleOpenChange(false);
      } catch (submitError) {
        console.error("Report review failed", submitError);
        setError("The action could not be completed. Refresh and try again.");
      }
    });
  }

  if (!report) return null;

  return (
    <>
      <Modal isOpen onOpenChange={handleOpenChange}>
        <Modal.Backdrop isDismissable={!pending} isKeyboardDismissDisabled={pending}>
          <Modal.Container size="lg" placement="center">
            <Modal.Dialog className={`rounded-2xl ${isOpenReport ? "lg:max-w-4xl!" : ""}`}>
              <Modal.CloseTrigger className="maintenance-modal-close" aria-label="Close review" isDisabled={pending}>
                <IconX size={16} aria-hidden="true" />
              </Modal.CloseTrigger>
              <Modal.Header className="pr-12">
                <Modal.Heading className="font-nunito text-lg font-bold text-primary">
                  {isOpenReport ? "Review report" : "Report details"}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="max-h-[70vh] overflow-y-auto">
                {/* Details on the left, the decision on the right (stacked on narrow screens). */}
                <div className={`grid items-start gap-5 ${isOpenReport ? "lg:grid-cols-2" : ""}`}>
                <div className="space-y-3">
                <dl className="grid content-start gap-4 rounded-xl border border-border bg-muted/40 p-4 sm:grid-cols-2">
                  <Detail label="Type">
                    <StatusChip size="sm" tone="neutral">
                      {USER_REPORT_TARGET_LABELS[report.target_type] ?? "Report"}
                    </StatusChip>
                  </Detail>
                  <Detail label="Reported on">{reportDateFormatter.format(new Date(report.created_at))}</Detail>
                  <Detail label="Status">
                    <StatusChip size="sm" tone={reportStatusColor(report.status)} className="capitalize">
                      {report.status}
                    </StatusChip>
                  </Detail>
                  <Detail label={isReviewRequest ? "Landlord" : "Reported"}>
                    {report.reported ? (
                      <Link href={`/admin/users/${report.reported.id}`} className={LINK_CLASSES}>
                        {formatReportPerson(report.reported)}
                      </Link>
                    ) : (
                      formatReportPerson(null)
                    )}
                    {report.reported?.is_suspended ? <span className="text-danger"> · Suspended</span> : null}
                  </Detail>
                  {!isReviewRequest ? (
                  <Detail label="Reported by">
                    {report.reporter ? (
                      <Link href={`/admin/users/${report.reporter.id}`} className={LINK_CLASSES}>
                        {formatReportPerson(report.reporter)}
                      </Link>
                    ) : (
                      formatReportPerson(null)
                    )}
                  </Detail>
                  ) : null}
                  {report.apartment ? (
                    <Detail label="Listing">
                      <Link href={`/admin/apartments/${report.apartment.id}`} className={LINK_CLASSES}>
                        {report.apartment.name}
                      </Link>
                      {report.apartment.is_hidden_by_admin ? <span className="text-danger"> · Hidden</span> : null}
                    </Detail>
                  ) : null}
                  {isReviewRequest ? (
                    <Detail label="Hidden because">
                      {report.apartment?.hidden_reason ?? <span className="text-muted-foreground">No reason recorded.</span>}
                    </Detail>
                  ) : (
                    <Detail label="Reason">{getReportReasonLabel(report.reason)}</Detail>
                  )}
                  <div className="sm:col-span-2">
                    <Detail label={isReviewRequest ? "Landlord's note" : "Details"}>
                      {report.details ? (
                        <span className="whitespace-pre-wrap">{report.details}</span>
                      ) : (
                        <span className="text-muted-foreground">No details were added.</span>
                      )}
                    </Detail>
                  </div>
                  {!isOpenReport ? (
                    <div className="sm:col-span-2">
                      <Detail label="Outcome">
                        {REPORT_ACTION_LABELS[report.action_taken] ? (
                          <span className="font-semibold">{REPORT_ACTION_LABELS[report.action_taken]}. </span>
                        ) : null}
                        {report.resolution_note ?? "No note was recorded."}
                        {report.resolved_at ? (
                          <span className="text-muted-foreground">
                            {" "}
                            ({reportDateFormatter.format(new Date(report.resolved_at))})
                          </span>
                        ) : null}
                      </Detail>
                    </div>
                  ) : null}
                </dl>

                {/* Shortcuts to the full listing and account pages. */}
                <div className="flex flex-wrap gap-2">
                  {report.apartment ? (
                    <Link
                      href={`/admin/apartments/${report.apartment.id}`}
                      className={`${buttonVariants({ size: "sm", variant: "outline" })} cursor-pointer gap-1.5 no-underline`}
                    >
                      <IconBuilding size={16} aria-hidden="true" />
                      View listing details
                    </Link>
                  ) : null}
                  {report.reported ? (
                    <Link
                      href={`/admin/users/${report.reported.id}`}
                      className={`${buttonVariants({ size: "sm", variant: "outline" })} cursor-pointer gap-1.5 no-underline`}
                    >
                      <IconUser size={16} aria-hidden="true" />
                      {isReviewRequest ? "View landlord" : "View reported account"}
                    </Link>
                  ) : null}
                </div>
                </div>

                {isOpenReport ? (
                <div className="space-y-5">
                <RadioGroup
                  aria-label="Action"
                  value={decision ?? ""}
                  onChange={(value) => setDecision(String(value) as Decision)}
                  isDisabled={pending}
                  className="report-reason-radios flex flex-col gap-2"
                >
                  <Label className="text-sm font-semibold">What should happen?</Label>
                  {options.map((option) => (
                    <Radio key={option.value} value={option.value} className="w-full min-w-0 cursor-pointer">
                      <Radio.Content
                        className={`flex w-full items-start gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted/50 ${
                          option.danger
                            ? "data-[selected=true]:border-danger data-[selected=true]:bg-danger/5"
                            : "data-[selected=true]:border-primary data-[selected=true]:bg-primary/5"
                        }`}
                      >
                        <Radio.Control className="mt-0.5 shrink-0">
                          <Radio.Indicator />
                        </Radio.Control>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-foreground">{option.label}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">{option.description}</span>
                        </span>
                      </Radio.Content>
                    </Radio>
                  ))}
                </RadioGroup>

                {selected?.value === "suspend_user" ? (
                  <RadioGroup
                    aria-label="How long the suspension lasts"
                    value={duration}
                    onChange={(value) => setDuration(String(value))}
                    isDisabled={pending}
                    className="report-reason-radios grid grid-cols-2 gap-2"
                  >
                    {SUSPENSION_DURATIONS.map((option) => (
                      <Radio key={option.value} value={option.value} className="w-full min-w-0 cursor-pointer">
                        <Radio.Content className="flex w-full items-center gap-2 rounded-xl border border-border p-3 text-left data-[selected=true]:border-primary data-[selected=true]:bg-primary/5">
                          <Radio.Control className="shrink-0">
                            <Radio.Indicator />
                          </Radio.Control>
                          <span className="text-sm font-semibold text-foreground">{option.label}</span>
                        </Radio.Content>
                      </Radio>
                    ))}
                  </RadioGroup>
                ) : null}

                {selected ? (
                  <TextArea
                    aria-label={selected.noteLabel}
                    placeholder={`${selected.noteLabel} (required, at least 3 characters)`}
                    value={note}
                    maxLength={500}
                    onChange={(event) => setNote(event.target.value)}
                    disabled={pending}
                    rows={3}
                    fullWidth
                  />
                ) : null}

                {error ? (
                  <p role="alert" className="text-sm text-danger">
                    {error}
                  </p>
                ) : null}
                </div>
                ) : null}
                </div>
              </Modal.Body>
              <Modal.Footer className="flex gap-2">
                {isOpenReport ? (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1 cursor-pointer rounded-full"
                      onPress={() => handleOpenChange(false)}
                      isDisabled={pending}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant={selected?.danger ? "danger" : "primary"}
                      className="flex-1 cursor-pointer rounded-full"
                      onPress={submit}
                      isDisabled={!canSubmit}
                    >
                      {pending ? "Saving…" : selected ? `Confirm ${selected.label.toLowerCase()}` : "Choose an action"}
                    </Button>
                  </>
                ) : (
                  <Button className="flex-1 cursor-pointer rounded-full" onPress={() => handleOpenChange(false)}>
                    Close
                  </Button>
                )}
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
