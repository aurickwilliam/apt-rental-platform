import { MIN_MONTHLY_RENT } from './apartmentPricing';

export const RENEWAL_REMINDER_DAYS = [60, 30, 14, 7] as const;
export const RENEWAL_REQUEST_WINDOW_DAYS = 30;
export const RENEWAL_MAX_REASON_LENGTH = 1000;
export const RENEWAL_REFRESH_INTERVAL_MS = 15_000;
export const RENEWAL_DEPOSIT_NOTICE = 'Landlord-declared deposit treatment; not independently verified by APT.';

export type RenewalPortal = 'tenant' | 'landlord';
export interface LeaseRenewalProposal {
  id: string;
  version: number;
  lease_start: string;
  lease_end: string;
  duration_months: number;
  monthly_rent: number;
  deposit_target: number;
  retained_deposit: number;
  replenishment_kind: 'none' | 'partial' | 'full';
  replenishment_reason: string;
  advance_months: 0 | 1;
  advance_period: string;
  advance_credit: number;
  advance_due: number;
  deposit_due: number;
  evidence_path: string | null;
  agreement_path?: string | null;
}
export interface LeaseRenewalContext {
  tenancyId: string;
  apartmentId: string;
  apartmentName: string;
  tenantName: string;
  tenantId: string;
  landlordId: string;
  active: boolean;
  today: string;
  leaseStart: string;
  leaseEnd: string | null;
  monthlyRent: number | null;
  depositTarget: number | null;
  originalAgreementPath: string | null;
  renewal: { id: string; status: RenewalStatus; version: number; current_proposal_id: string | null; requested_start: string; duration_months: number|null } | null;
  proposals: LeaseRenewalProposal[];
  agreement: { path: string; landlord_confirmed_at: string | null; tenant_confirmed_at: string | null } | null;
  events: { id: string; event: string; reason: string; created_at: string }[];
  payment: { id: string; status: string; referenceId: string | null; sessionId: string | null } | null;
}

/** Server-owned JSON contract; reject a missing/mismatched resource before use. */
export function readLeaseRenewalContext(value: unknown, tenancyId: string): LeaseRenewalContext {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Could not load renewal details.');
  const row = value as Record<string, unknown>;
  if (row.tenancyId !== tenancyId || typeof row.today !== 'string' || !Array.isArray(row.proposals) || !Array.isArray(row.events)) {
    throw new Error('The renewal details have changed. Refresh before continuing.');
  }
  if (row.renewal && (typeof row.renewal !== 'object' || !('status' in row.renewal)
    || !Object.hasOwn(RENEWAL_STATUS_LABELS, String(row.renewal.status)))) throw new Error('This renewal needs a newer app version.');
  return value as LeaseRenewalContext;
}
export type RenewalStatus =
  | 'pending_landlord_review'
  | 'awaiting_payment_configuration'
  | 'awaiting_tenant_confirmation'
  | 'awaiting_agreement_confirmation'
  | 'awaiting_payment'
  | 'payment_verification_pending'
  | 'renewed'
  | 'declined'
  | 'not_renewing'
  | 'requires_review';

export const RENEWAL_STATUS_LABELS: Record<RenewalStatus, string> = {
  pending_landlord_review: 'Pending landlord review',
  awaiting_payment_configuration: 'Awaiting payment configuration',
  awaiting_tenant_confirmation: 'Awaiting tenant confirmation',
  awaiting_agreement_confirmation: 'Awaiting agreement confirmation',
  awaiting_payment: 'Awaiting payment',
  payment_verification_pending: 'Payment verification pending',
  renewed: 'Renewed — scheduled',
  declined: 'Declined',
  not_renewing: 'Tenant will not renew',
  requires_review: 'Requires review',
};

/** Date-only arithmetic is deliberately independent of the device's timezone. */
function dateNumber(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const number = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(number) && new Date(number).toISOString().slice(0, 10) === value ? number : null;
}

export function renewalDaysRemaining(leaseEnd: string | null, today: string): number | null {
  const end = leaseEnd ? dateNumber(leaseEnd) : null;
  const now = dateNumber(today);
  return end === null || now === null ? null : (end - now) / 86_400_000;
}

export function renewalDefaultStart(leaseEnd:string|null):string|null {
  const end=leaseEnd?dateNumber(leaseEnd):null;
  if(end===null)return null;
  const next=new Date(end+86_400_000).toISOString();
  return /^\d{4}-/.test(next)?next.slice(0,10):null;
}

export function previousLeaseDurationMonths(start: string, end: string | null): number | null {
  const startNumber = dateNumber(start);
  const endNumber = end ? dateNumber(end) : null;
  if (startNumber === null || endNumber === null) return null;
  const date = new Date(startNumber);
  for (let months = 1; months <= 120; months++) {
    const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
    const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    target.setUTCDate(Math.min(date.getUTCDate(), last));
    if (target.getTime() === endNumber || target.getTime() - 86_400_000 === endNumber) return months;
  }
  return null;
}

export function lockedRenewalDurationMonths(context: LeaseRenewalContext): number | null {
  const previous = previousLeaseDurationMonths(context.leaseStart, context.leaseEnd);
  if (previous !== null) return previous;
  return context.renewal?.duration_months ?? null;
}

export interface RenewalProposalDraft {
  monthlyRent: string;
  retainedDeposit: string;
  advanceMonths: '0' | '1';
  replenishmentKind: RenewalChargeInput['replenishmentKind'];
  reason: string;
}

export function initialRenewalProposalDraft(context: LeaseRenewalContext): RenewalProposalDraft {
  const proposal = context.proposals[0];
  return {
    monthlyRent: String(proposal?.monthly_rent ?? context.monthlyRent ?? ''),
    // Never prefill a guessed actual deposit balance; the landlord must declare it.
    retainedDeposit: '',
    advanceMonths: String(proposal?.advance_months ?? 0) as '0' | '1',
    replenishmentKind: 'none', reason: '',
  };
}

export function renewalProposalPayload(context: LeaseRenewalContext, draft: RenewalProposalDraft, proposalId: string, evidencePath: string | null): Record<string,string|number|null> {
  const months = lockedRenewalDurationMonths(context);
  if (!context.renewal || months === null) {
    throw new Error('Previous lease length is unclear. The renewal needs review.');
  }
  if (draft.retainedDeposit.trim() === '') {
    throw new Error('Declare the deposit amount still retained.');
  }
  const result = calculateRenewalCharges({ currentMonthlyRent: context.monthlyRent ?? 0,
    monthlyRent: Number(draft.monthlyRent), depositTarget: context.depositTarget,
    declaredRetainedDeposit: Number(draft.retainedDeposit), replenishmentKind: draft.replenishmentKind,
    replenishmentReason: draft.reason, advanceMonths: Number(draft.advanceMonths) as 0|1, verifiedAdvanceCredit: 0 });
  if (!result.ok) throw new Error(result.error);
  return { proposalId, durationMonths: months, monthlyRent: Number(draft.monthlyRent),
    retainedDeposit: Number(draft.retainedDeposit), replenishmentKind: draft.replenishmentKind,
    reason: draft.reason, advanceMonths: Number(draft.advanceMonths),
    leaseStart: context.renewal.requested_start, evidencePath };
}

export function canRequestLeaseRenewal(leaseEnd: string | null, today: string, active: boolean): boolean {
  const days = renewalDaysRemaining(leaseEnd, today);
  return active && days !== null && days >= 0 && days <= RENEWAL_REQUEST_WINDOW_DAYS;
}

/** Select only the newest applicable milestone after an outage or late enrollment. */
export function renewalReminderMilestone(daysRemaining: number): number | null {
  if (!Number.isInteger(daysRemaining) || daysRemaining < 0) return null;
  return [...RENEWAL_REMINDER_DAYS].reverse().find((days) => daysRemaining <= days) ?? null;
}

export function renewalStatusLabel(status: RenewalStatus, start: string | null, today: string): string {
  return status === 'renewed' && start && dateNumber(start) !== null && dateNumber(today) !== null && start <= today
    ? 'Renewed — effective'
    : RENEWAL_STATUS_LABELS[status];
}

export type RenewalAction = 'approve' | 'propose' | 'accept' | 'confirm_agreement' | 'decline' | 'discuss';

/** Presentation only. Every mutation must independently authorize in SQL. */
export function canTakeRenewalAction(status: RenewalStatus, portal: RenewalPortal, action: RenewalAction): boolean {
  if (action === 'discuss') return !['renewed', 'declined', 'not_renewing'].includes(status);
  if (action === 'approve') return portal === 'landlord' && status === 'pending_landlord_review';
  if (action === 'propose') return portal === 'landlord' && ['awaiting_payment_configuration', 'awaiting_tenant_confirmation', 'awaiting_agreement_confirmation', 'awaiting_payment'].includes(status);
  if (action === 'accept') return portal === 'tenant' && status === 'awaiting_tenant_confirmation';
  if (action === 'confirm_agreement') return status === 'awaiting_agreement_confirmation';
  return ['pending_landlord_review', 'awaiting_payment_configuration', 'awaiting_tenant_confirmation', 'awaiting_agreement_confirmation', 'awaiting_payment'].includes(status);
}

/** Reject unsupported precision instead of silently rounding an agreed amount. */
export function renewalCentavos(amount: number): number | null {
  if (!Number.isFinite(amount) || amount < 0) return null;
  const cents = Math.round(amount * 100);
  return Number.isSafeInteger(cents) && Math.abs(amount * 100 - cents) < 0.000001 ? cents : null;
}

export interface RenewalChargeInput {
  currentMonthlyRent: number;
  monthlyRent: number;
  depositTarget: number | null;
  declaredRetainedDeposit: number | null;
  replenishmentKind: 'none' | 'partial' | 'full';
  replenishmentReason: string;
  advanceMonths: 0 | 1;
  /** Confirmed allocations for this exact period, supplied by the server. */
  verifiedAdvanceCredit: number;
}

export interface RenewalChargeSummary {
  advanceRent: number;
  advanceCredit: number;
  advanceDue: number;
  depositReplenishment: number;
  total: number;
}

export type RenewalChargeResult = { ok: true; charges: RenewalChargeSummary } | { ok: false; error: string };

/** Client feedback; the server re-reads verified credits and validates every field. */
export function calculateRenewalCharges(input: RenewalChargeInput): RenewalChargeResult {
  const rent = renewalCentavos(input.monthlyRent);
  const previousRent = renewalCentavos(input.currentMonthlyRent);
  if (rent === null || previousRent === null || input.monthlyRent < MIN_MONTHLY_RENT || rent > previousRent) {
    return { ok: false, error: `Renewal rent must be at least ₱${MIN_MONTHLY_RENT} and cannot exceed the current agreed rent.` };
  }
  if (input.depositTarget === null || input.declaredRetainedDeposit === null) {
    return { ok: false, error: 'Confirm the existing deposit target and declared retained amount before proposing charges.' };
  }
  const target = renewalCentavos(input.depositTarget);
  const retained = renewalCentavos(input.declaredRetainedDeposit);
  const credit = renewalCentavos(input.verifiedAdvanceCredit);
  if (target === null || retained === null || credit === null || target > rent * 2 || retained > target) {
    return { ok: false, error: 'Check the recorded deposit target, retained deposit, and verified credit. A deposit cannot exceed two months of renewal rent.' };
  }
  if (input.advanceMonths !== 0 && input.advanceMonths !== 1) {
    return { ok: false, error: 'Advance rent must be none or one month.' };
  }
  const replenishment = target - retained;
  const validKind = input.replenishmentKind === 'none' ? replenishment === 0
    : input.replenishmentKind === 'full' ? target > 0 && retained === 0
    : input.replenishmentKind === 'partial' && replenishment > 0 && retained > 0;
  if (!validKind) return { ok: false, error: 'The replenishment option must match the declared retained deposit.' };
  if (replenishment > 0 && (!input.replenishmentReason.trim() || input.replenishmentReason.length > RENEWAL_MAX_REASON_LENGTH)) {
    return { ok: false, error: `Explain the deposit replenishment in 1–${RENEWAL_MAX_REASON_LENGTH} characters.` };
  }
  const advance = rent * input.advanceMonths;
  const applied = Math.min(advance, credit);
  const total = advance - applied + replenishment;
  if (!Number.isSafeInteger(total)) return { ok: false, error: 'The proposed total is too large.' };
  return { ok: true, charges: {
    advanceRent: advance / 100, advanceCredit: applied / 100, advanceDue: (advance - applied) / 100,
    depositReplenishment: replenishment / 100, total: total / 100,
  } };
}
