"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, Button, TextField, Label, Input, FieldError, TextArea, Separator, Select, ListBox, NumberField, Spinner } from "@heroui/react";
import { toast } from "@heroui/react";
import { createClient } from "@repo/supabase/browser";
import { useTenantApplications } from "@/hooks/use-tenant-applications";
import { useVisitRequest } from "@/hooks/use-visit-request";
import { useSubmitVisitRequest } from "@/hooks/use-submit-visit-request";
import { ArrowLeft } from "lucide-react";

function RequestVisitPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const applicationId = searchParams.get("applicationId") ?? "";
  const apartmentIdParam = searchParams.get("apartmentId") ?? "";

  const [visitDate, setVisitDate] = useState("");
  const [visitHour, setVisitHour] = useState<string>("");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");
  const [noVisitors, setNoVisitors] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [landlordId, setLandlordId] = useState<string | null>(null);
  const [resolvingLandlord, setResolvingLandlord] = useState(true);

  const { applications } = useTenantApplications();
  const { visitRequest } = useVisitRequest(applicationId);
  const { submitVisitRequest, loading: submitting } = useSubmitVisitRequest();

  const apartmentName = applications.find((a) => a.id === applicationId)?.apartments?.name ?? null;

  useEffect(() => {
    async function resolveLandlord() {
      if (!apartmentIdParam) {
        setResolvingLandlord(false);
        return;
      }
      const supabase = createClient();
      const { data } = await supabase
        .from("apartments")
        .select("landlord_id")
        .eq("id", apartmentIdParam)
        .maybeSingle();
      setLandlordId(data?.landlord_id ?? null);
      setResolvingLandlord(false);
    }
    void resolveLandlord();
  }, [apartmentIdParam]);

  const clearError = (k: string) => setErrors((p) => ({ ...p, [k]: "" }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (!visitDate) next.visitDate = "Please select a visit date.";
    else {
      const d = new Date(visitDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const picked = new Date(d);
      picked.setHours(0, 0, 0, 0);
      if (picked <= today) next.visitDate = "Visit date must be at least a day from today.";
    }
    if (!visitHour) next.visitHour = "Please select a visit time.";
    const n = parseInt(noVisitors, 10);
    if (!noVisitors || Number.isNaN(n) || n <= 0) next.noVisitors = "Please enter number of visitors.";
    // Only an active visit (pending / approved / rescheduled) blocks a new one.
    // Rejected or cancelled visits stay in history — the tenant may request again.
    // Mirrors the DB partial unique index visit_request_one_active_per_application.
    if (
      visitRequest &&
      (visitRequest.status === "pending" ||
        visitRequest.status === "approved" ||
        visitRequest.status === "rescheduled")
    )
      next.visitDate = "You already have an active visit request for this application.";
    setErrors(next);
    return Object.values(next).every((v) => !v);
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.danger("Please fix the highlighted fields.");
      return;
    }
    if (!landlordId) {
      toast.danger("Could not resolve the landlord for this listing.");
      return;
    }
    const result = await submitVisitRequest({
      apartmentId: apartmentIdParam,
      applicationId,
      landlordId,
      form: { visitDate, visitHour, period, noVisitors, notes },
    });
    if (!result.success) {
      toast.danger(result.error);
      return;
    }
    toast.success("Visit request submitted");
    router.back();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <Button variant="outline" size="sm" onPress={() => router.back()}>
        <ArrowLeft size={16} /> Back
      </Button>

      <Card className="border border-border bg-card text-card-foreground p-6 rounded-2xl">
        <h1 className="text-xl font-bold text-card-foreground">Request a Visit</h1>
        {apartmentName && <p className="text-sm text-muted-foreground">For {apartmentName}</p>}
        <p className="text-xs text-muted-foreground mt-2">Choose your preferred date and time. The landlord will confirm your visit.</p>

        {resolvingLandlord ? (
          <div className="flex justify-center py-8">
            <Spinner color="accent" />
          </div>
        ) : (
          <div className="flex flex-col gap-5 mt-6">
            <TextField isRequired isInvalid={!!errors.visitDate} value={visitDate} onChange={(v: string) => { setVisitDate(v); if (v) clearError("visitDate"); }}>
              <Label>Preferred Visit Date</Label>
              <Input type="date" className="bg-card border-border text-card-foreground" />
              <FieldError>{errors.visitDate}</FieldError>
            </TextField>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <TextField isRequired isInvalid={!!errors.visitHour}>
                <Label>Preferred Visit Time</Label>
                <div className="flex gap-2">
                  <Select placeholder="Hour" value={visitHour || null} onChange={(k) => { const v = k ? String(k) : ""; setVisitHour(v); if (v) clearError("visitHour"); }} className="flex-1">
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
                  <Select value={period} onChange={(k) => setPeriod((k ? String(k) : "AM") as "AM" | "PM")} className="w-24">
                    <Select.Trigger className="bg-card border-border text-card-foreground">
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        <ListBox.Item id="AM" textValue="AM">
                          AM
                        </ListBox.Item>
                        <ListBox.Item id="PM" textValue="PM">
                          PM
                        </ListBox.Item>
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>
                <FieldError>{errors.visitHour}</FieldError>
              </TextField>

              <NumberField
                minValue={1}
                maxValue={10}
                value={noVisitors ? parseInt(noVisitors, 10) : undefined}
                onChange={(value) => {
                  const v = value == null || Number.isNaN(value as number) ? "" : String(value);
                  setNoVisitors(v);
                  if (v) clearError("noVisitors");
                }}
                isRequired
                isInvalid={!!errors.noVisitors}
              >
                <Label>Number of Visitors</Label>
                <NumberField.Group className="flex items-center w-full bg-card border border-border rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-colors">
                  <NumberField.DecrementButton className="px-4 py-2.5 text-muted-foreground hover:bg-muted active:bg-muted border-r border-border flex items-center justify-center min-w-11" />
                  <NumberField.Input placeholder="e.g. 2" className="w-full text-center bg-transparent py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground outline-none" />
                  <NumberField.IncrementButton className="px-4 py-2.5 text-muted-foreground hover:bg-muted active:bg-muted border-l border-border flex items-center justify-center min-w-11" />
                </NumberField.Group>
                <FieldError>{errors.noVisitors}</FieldError>
              </NumberField>
            </div>

            <Separator />

            <TextField value={notes} onChange={(v: string) => setNotes(v)}>
              <Label>Additional Notes (Optional)</Label>
              <TextArea placeholder="Any specific questions or requests for the visit..." rows={4} className="bg-card border-border text-card-foreground" />
            </TextField>

            <Button onPress={handleSubmit} isDisabled={submitting}>
              {submitting ? "Submitting..." : "Submit Visit Request"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function RequestVisitPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-4 py-6">Loading...</div>}>
      <RequestVisitPageInner />
    </Suspense>
  );
}
