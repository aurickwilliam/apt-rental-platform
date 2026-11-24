import type { LeaseRenewalContext, LeaseRenewalProposal } from "@repo/utils";

export const proposal: LeaseRenewalProposal = {
  id: "proposal", version: 1, lease_start: "2026-12-01", lease_end: "2027-11-30", duration_months: 12,
  monthly_rent: 18000, deposit_target: 36000, retained_deposit: 30000, replenishment_kind: "partial",
  replenishment_reason: "Agreed deposit replenishment", advance_months: 1, advance_period: "2026-12-01",
  advance_credit: 2000, advance_due: 16000, deposit_due: 6000, evidence_path: "evidence.pdf", agreement_path: "saved.pdf",
};

export function context(overrides: Partial<LeaseRenewalContext> = {}): LeaseRenewalContext {
  return {
    tenancyId: "tenancy", apartmentId: "apartment", apartmentName: "Navotas West City Center 1BR",
    tenantName: "Test Tenant", tenantId: "tenant", landlordId: "landlord", active: true, today: "2026-11-06",
    leaseStart: "2025-12-01", leaseEnd: "2026-11-30", monthlyRent: 18000, depositTarget: 36000,
    originalAgreementPath: "original.pdf", renewal: null, proposals: [], agreement: null, events: [], payment: null,
    ...overrides,
  };
}

export function renewalContext(status: NonNullable<LeaseRenewalContext["renewal"]>["status"]): LeaseRenewalContext {
  return context({
    renewal: { id: "renewal", status, version: 1, current_proposal_id: proposal.id, requested_start: proposal.lease_start, duration_months: 12 },
    proposals: [proposal],
  });
}
