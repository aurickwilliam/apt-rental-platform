import { formatDate, type RenewalPortal, type RenewalStatus } from "@repo/utils";

export const RENEWAL_STEPS = ["Request", "Terms", "Agreement", "Payment"] as const;

// Presentation only; eligibility and actions remain in @repo/utils and the database.
export function renewalStage(status: RenewalStatus | null): number | null {
  switch (status) {
    case "pending_landlord_review": return 0;
    case "awaiting_payment_configuration":
    case "awaiting_tenant_confirmation": return 1;
    case "awaiting_agreement_confirmation": return 2;
    case "awaiting_payment":
    case "payment_verification_pending": return 3;
    case "renewed": return RENEWAL_STEPS.length;
    default: return null;
  }
}

export function renewalTone(status: RenewalStatus | null) {
  if (status === "renewed") return "success";
  if (status === "declined") return "danger";
  if (status === null || status === "not_renewing") return "neutral";
  return "warning";
}

export function renewalNextStep(status: RenewalStatus, portal: RenewalPortal): string {
  switch (status) {
    case "pending_landlord_review": return portal === "tenant"
      ? "Your request is with the landlord. You can review the renewal terms here once they are ready."
      : "Review the tenant’s request, then approve it to prepare renewal terms or decline.";
    case "awaiting_payment_configuration": return portal === "tenant"
      ? "The landlord is preparing your renewal terms and charges. No payment is needed yet."
      : "Prepare the renewal terms and charges for the tenant to review.";
    case "awaiting_tenant_confirmation": return portal === "tenant"
      ? "Review the proposed dates, rent and charges below before accepting."
      : "The tenant is reviewing your proposal. You can still send revised terms.";
    case "awaiting_agreement_confirmation": return "Both parties must confirm the signed renewal agreement matches the accepted proposal.";
    case "awaiting_payment": return portal === "tenant"
      ? "Your agreement is confirmed. Complete the renewal payment below."
      : "Waiting for the tenant’s renewal payment. Cash payments need your confirmation.";
    case "payment_verification_pending": return "A renewal payment is awaiting verification. Do not submit another payment.";
    case "renewed": return "The renewal is confirmed. The agreed terms apply from the renewal start date.";
    case "declined": return "This renewal was declined. Your current tenancy has not been ended by this decision.";
    case "not_renewing": return "The tenant chose not to renew. This decision does not end the current tenancy early.";
    case "requires_review": return "This renewal needs review before it can continue. Check the recorded lease details and contact the other party.";
  }
}

export function renewalDate(value: string | null): string {
  if (!value) return "Not recorded";
  return formatDate(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value, "medium") || "Not recorded";
}

const EVENT_LABELS: Record<string, string> = {
  request: "Renewal requested", approve: "Request approved", propose: "Proposal sent",
  accept: "Terms accepted", agreement: "Agreement uploaded", confirm_agreement: "Agreement confirmed",
  renewed: "Renewal confirmed", decline: "Renewal declined", declined: "Renewal declined",
  not_renewing: "Tenant will not renew", requires_review: "Review needed",
};

export function renewalEventLabel(event: string): string {
  return EVENT_LABELS[event] ?? event.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}
