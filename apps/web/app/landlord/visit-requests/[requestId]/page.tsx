"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Avatar,
  Button,
  Card,
  Chip,
  FieldError,
  Label,
  ListBox,
  Modal,
  Select,
  Separator,
  Spinner,
  TextArea,
  TextField,
  useOverlayState,
} from "@heroui/react";
import { ArrowLeft, Image as ImageIcon, MapPin } from "lucide-react";
import { toast } from "@heroui/react";
import { formatAddress, formatDate, formatFullName, formatTime, getInitials } from "@repo/utils";

import { useLandlordVisitRequests } from "@/hooks/use-landlord-visit-requests";
import { useLandlordVisitRequestActions } from "@/hooks/use-landlord-visit-request-actions";

import { getVisitStatusChipColor, getVisitStatusLabel } from "../lib/visit-status-styles";

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 flex-1">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <span className="text-sm font-semibold text-card-foreground">{value}</span>
    </div>
  );
}

function toSupabaseTime(hour: string, period: "AM" | "PM"): string {
  let h = parseInt(hour, 10);
  if (period === "AM" && h === 12) h = 0;
  if (period === "PM" && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:00:00`;
}

export default function LandlordVisitRequestDetailPage() {
  const router = useRouter();
  const params = useParams<{ requestId: string }>();
  const requestId = params.requestId;

  const { visitRequests, loading, error, refetch } = useLandlordVisitRequests();
  const {
    approve,
    reject,
    reschedule,
    isApproving,
    isRejecting,
    isRescheduling,
    errorMessage,
  } = useLandlordVisitRequestActions(requestId, () => void refetch());

  const rejectDialog = useOverlayState();
  const approveDialog = useOverlayState();
  const rescheduleDialog = useOverlayState();

  const [rejectReason, setRejectReason] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleHour, setRescheduleHour] = useState("");
  const [reschedulePeriod, setReschedulePeriod] = useState<"AM" | "PM">("AM");
  const [rescheduleError, setRescheduleError] = useState("");

  const request = useMemo(
    () => visitRequests.find((item) => item.id === requestId) ?? null,
    [visitRequests, requestId],
  );

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 flex justify-center">
        <Spinner color="accent" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">{error ?? "Visit request not found."}</p>
        <Button variant="outline" className="mt-4" onPress={() => router.back()}>
          <ArrowLeft size={16} /> Back
        </Button>
      </div>
    );
  }

  const tenantName =
    formatFullName({ first_name: request.tenant.first_name, last_name: request.tenant.last_name }) ||
    "Unknown tenant";
  const apartmentAddress = formatAddress({
    street_address: request.apartment.street_address,
    barangay: request.apartment.barangay,
    city: request.apartment.city,
    province: request.apartment.province,
    zip_code: request.apartment.zip_code !== null ? String(request.apartment.zip_code) : null,
  });
  const isPending = request.status === "pending";
  const isAnyActionLoading = isApproving || isRejecting || isRescheduling;

  const handleApproveConfirm = async () => {
    if (await approve()) {
      approveDialog.setOpen(false);
      toast.success("Visit request approved");
    } else {
      toast.danger("Failed to approve. Please try again.");
    }
  };

  const handleRejectConfirm = async () => {
    if (await reject(rejectReason.trim())) {
      setRejectReason("");
      rejectDialog.setOpen(false);
      toast.success("Visit request rejected");
    } else {
      toast.danger("Failed to reject. Please try again.");
    }
  };

  const handleRescheduleConfirm = async () => {
    if (!rescheduleDate || !rescheduleHour) {
      setRescheduleError("Please select a date and time.");
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(`${rescheduleDate}T00:00:00`) <= today) {
      setRescheduleError("Please select a date starting tomorrow.");
      return;
    }
    setRescheduleError("");
    if (await reschedule(rescheduleDate, toSupabaseTime(rescheduleHour, reschedulePeriod))) {
      rescheduleDialog.setOpen(false);
      toast.success("New visit time proposed");
    } else {
      toast.danger("Failed to reschedule. Please try again.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <Button variant="outline" size="sm" onPress={() => router.back()}>
        <ArrowLeft size={16} /> Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
        <div className="flex flex-col gap-4 min-w-0">
          {request.apartment.cover_url ? (
            <div className="rounded-3xl overflow-hidden border border-border h-56 lg:h-72">
              <img src={request.apartment.cover_url} alt={request.apartment.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="rounded-3xl border border-border h-56 lg:h-72 bg-muted flex items-center justify-center">
              <ImageIcon size={48} className="text-muted-foreground" />
            </div>
          )}

          <Card className="border border-border bg-card text-card-foreground p-5 rounded-2xl">
            <h1 className="text-xl font-bold text-primary">{request.apartment.name}</h1>
            {apartmentAddress && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin size={14} className="shrink-0" /> {apartmentAddress}
              </p>
            )}

            <Separator className="my-4" />

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <DetailItem label="No. of Visitors" value={`${request.no_visitors} Person${request.no_visitors > 1 ? "s" : ""}`} />
              <DetailItem label="Date Submitted" value={formatDate(request.created_at, "medium")} />
              <DetailItem label="Requested Date" value={formatDate(request.visit_date, "long")} />
              <DetailItem label="Requested Time" value={formatTime(request.time)} />
              {request.confirmed_visit_date && (
                <DetailItem label="Confirmed Date" value={formatDate(request.confirmed_visit_date, "long")} />
              )}
              {request.confirmed_time && (
                <DetailItem label="Confirmed Time" value={formatTime(request.confirmed_time)} />
              )}
            </div>

            {request.status === "rejected" && request.rejected_reason && (
              <div className="mt-4 rounded-2xl border border-red-200 dark:border-red-900 p-3">
                <p className="text-sm font-semibold text-red-600">Rejection Reason</p>
                <p className="text-sm text-card-foreground mt-1">{request.rejected_reason}</p>
              </div>
            )}

            <div className="mt-4">
              <p className="text-xs text-muted-foreground font-medium">Notes / Message</p>
              <div className="mt-1 rounded-2xl bg-muted border border-border p-3">
                <p className="text-sm text-card-foreground">{request.notes ?? "No additional notes provided."}</p>
              </div>
            </div>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-4">
          <Card className="border border-border bg-card text-card-foreground p-5 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Avatar size="md" className="shrink-0">
                {request.tenant.avatar_url ? (
                  <img src={request.tenant.avatar_url} alt={tenantName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-semibold">{getInitials(tenantName)}</span>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-card-foreground truncate">{tenantName}</p>
                <p className="text-xs text-muted-foreground">{request.tenant.mobile_number ?? "No contact number"}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Status</span>
              <Chip size="sm" variant="soft" color={getVisitStatusChipColor(request.status)} className="capitalize shrink-0">
                {getVisitStatusLabel(request.status)}
              </Chip>
            </div>

            <Separator />

            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

            {isPending ? (
              <div className="flex flex-col gap-2">
                <Button size="sm" className="w-full" isDisabled={isAnyActionLoading} onPress={() => approveDialog.setOpen(true)}>
                  Approve
                </Button>
                <Button variant="tertiary" size="sm" className="w-full" isDisabled={isAnyActionLoading} onPress={() => rescheduleDialog.setOpen(true)}>
                  Reschedule
                </Button>
                <Button variant="danger" size="sm" className="w-full" isDisabled={isAnyActionLoading} onPress={() => rejectDialog.setOpen(true)}>
                  Reject
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center">This request has been {getVisitStatusLabel(request.status).toLowerCase()}.</p>
            )}
          </Card>
        </aside>
      </div>

      <Modal isOpen={rejectDialog.isOpen} onOpenChange={rejectDialog.setOpen}>
        <Modal.Backdrop>
          <Modal.Container size="sm">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Reject Visit Request</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm text-muted-foreground">Provide a reason for rejection (optional). The tenant will be notified.</p>
                <TextField value={rejectReason} onChange={(v: string) => setRejectReason(v)}>
                  <Label>Reason</Label>
                  <TextArea placeholder="e.g. The unit is unavailable on that date..." rows={4} />
                </TextField>
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onPress={() => rejectDialog.setOpen(false)}>
                  Cancel
                </Button>
                <Button variant="danger" size="sm" isDisabled={isRejecting} onPress={handleRejectConfirm}>
                  {isRejecting ? "Rejecting..." : "Confirm Reject"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal isOpen={approveDialog.isOpen} onOpenChange={approveDialog.setOpen}>
        <Modal.Backdrop>
          <Modal.Container size="sm">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Approve Visit Request</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm text-muted-foreground">Are you sure you want to approve this visit request? The tenant will be notified.</p>
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onPress={() => approveDialog.setOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" isDisabled={isApproving} onPress={handleApproveConfirm}>
                  {isApproving ? "Approving..." : "Approve"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal isOpen={rescheduleDialog.isOpen} onOpenChange={rescheduleDialog.setOpen}>
        <Modal.Backdrop>
          <Modal.Container size="sm">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Propose a New Time</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm text-muted-foreground">The tenant will be asked to accept or decline the new slot.</p>
                <div className="flex flex-col gap-4 mt-2">
                  <TextField
                    isRequired
                    isInvalid={!!rescheduleError}
                    value={rescheduleDate}
                    onChange={(v: string) => {
                      setRescheduleDate(v);
                      if (v) setRescheduleError("");
                    }}
                  >
                    <Label>New Visit Date</Label>
                    <input
                      type="date"
                      value={rescheduleDate}
                      onChange={(e) => {
                        setRescheduleDate(e.target.value);
                        if (e.target.value) setRescheduleError("");
                      }}
                      className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm text-card-foreground outline-none focus:border-primary"
                    />
                    <FieldError>{rescheduleError}</FieldError>
                  </TextField>
                  <div>
                    <Label className="text-sm font-medium text-card-foreground mb-2 block">
                      New Visit Time <span className="text-red-600">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Select
                        placeholder="Hour"
                        value={rescheduleHour || null}
                        onChange={(k) => {
                          const v = k ? String(k) : "";
                          setRescheduleHour(v);
                          if (v) setRescheduleError("");
                        }}
                        className="flex-1"
                      >
                        <Select.Trigger className="bg-card border-border text-card-foreground">
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((h) => (
                              <ListBox.Item key={h} id={h} textValue={h}>
                                {h}:00
                              </ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                      </Select>
                      <Select
                        value={reschedulePeriod}
                        onChange={(k) => setReschedulePeriod((k ? String(k) : "AM") as "AM" | "PM")}
                        className="w-24"
                      >
                        <Select.Trigger className="bg-card border-border text-card-foreground">
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            <ListBox.Item id="AM" textValue="AM">AM</ListBox.Item>
                            <ListBox.Item id="PM" textValue="PM">PM</ListBox.Item>
                          </ListBox>
                        </Select.Popover>
                      </Select>
                    </div>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onPress={() => rescheduleDialog.setOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" isDisabled={isRescheduling} onPress={handleRescheduleConfirm}>
                  {isRescheduling ? "Sending..." : "Send Proposal"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
