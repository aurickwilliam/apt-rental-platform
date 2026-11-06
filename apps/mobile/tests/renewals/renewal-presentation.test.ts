import type { RenewalStatus } from "@repo/utils";
import { RENEWAL_STEPS, renewalDate, renewalEventLabel, renewalNextStep, renewalProposalNumber, renewalStage, renewalTone } from "@/utils/renewalPresentation";
import { proposal } from "./fixtures";

it("numbers the first actual proposal as 1 even when its internal version is 3", () => {
  const first = { ...proposal, version: 3 };
  expect(renewalProposalNumber([first], first)).toBe(1);
  expect(first.version).toBe(3);
});

it("numbers actual revisions consecutively despite version gaps or list order", () => {
  const first = { ...proposal, id: "first", version: 3 };
  const second = { ...proposal, id: "second", version: 8 };
  const third = { ...proposal, id: "third", version: 11 };
  const proposals = [third, first, second];
  expect([first, second, third].map((p) => renewalProposalNumber(proposals, p))).toEqual([1, 2, 3]);
  expect(proposals.map((p) => p.id)).toEqual(["third", "first", "second"]);
});

it("restarts proposal numbering for a later renewal without counting past renewals", () => {
  const past = { ...proposal, id: "past", version: 3, lease_start: "2025-12-01" };
  const first = { ...proposal, id: "first", version: 3 };
  const second = { ...proposal, id: "second", version: 4 };
  const proposals = [second, first, past];
  expect(renewalProposalNumber(proposals, past)).toBe(1);
  expect(renewalProposalNumber(proposals, first)).toBe(1);
  expect(renewalProposalNumber(proposals, second)).toBe(2);
});

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
