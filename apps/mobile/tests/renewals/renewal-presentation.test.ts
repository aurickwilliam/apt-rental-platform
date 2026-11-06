import type { RenewalStatus } from "@repo/utils";
import { RENEWAL_STEPS, renewalDate, renewalEventLabel, renewalNextStep, renewalStage, renewalTone } from "@/utils/renewalPresentation";

it.each<[RenewalStatus, number]>([
  ["pending_landlord_review", 0], ["awaiting_payment_configuration", 1], ["awaiting_tenant_confirmation", 1],
  ["awaiting_agreement_confirmation", 2], ["awaiting_payment", 3], ["payment_verification_pending", 3], ["renewed", 4],
])("maps %s to the correct presentation stage", (status, stage) => {
  expect(renewalStage(status)).toBe(stage);
});

it.each<RenewalStatus | null>([null, "declined", "not_renewing", "requires_review"])("does not show completed progress for %s", (status) => {
  expect(renewalStage(status)).toBeNull();
  expect(renewalTone(status)).not.toBe("success");
});

it("marks only a confirmed renewal as successfully complete", () => {
  expect(renewalStage("renewed")).toBe(RENEWAL_STEPS.length);
  expect(renewalTone("renewed")).toBe("success");
});

it("distinguishes the tenant and landlord next actions without changing eligibility", () => {
  expect(renewalNextStep("awaiting_payment_configuration", "tenant")).toContain("No payment is needed yet");
  expect(renewalNextStep("awaiting_payment_configuration", "landlord")).toContain("Prepare");
  expect(renewalNextStep("payment_verification_pending", "tenant")).toContain("Do not submit another payment");
});

it("formats date-only labels without shifting the day and handles missing dates", () => {
  expect(renewalDate("2026-12-01")).toBe("Dec 1, 2026");
  expect(renewalDate(null)).toBe("Not recorded");
  expect(renewalDate("invalid")).toBe("Not recorded");
});

it("uses readable history labels and preserves unknown event wording", () => {
  expect(renewalEventLabel("confirm_agreement")).toBe("Agreement confirmed");
  expect(renewalEventLabel("payment_received")).toBe("Payment received");
});
