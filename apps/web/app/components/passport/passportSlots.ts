import type { ApplicationDocumentSlot } from "@repo/constants";

/**
 * Passport upload type offered when an application slot needs a document.
 * The ID slot has none: it comes from account verification.
 */
export const PASSPORT_SLOT_UPLOAD_TYPE: Record<Exclude<ApplicationDocumentSlot, "govId">, string> = {
  proofOfIncome: "Proof of Income",
  proofOfBilling: "Proof of Residency",
  nbiClearance: "NBI Clearance",
};

/** Wallet link that opens the add modal for a slot, or `/verify` for the ID. */
export function passportFixHref(slot: ApplicationDocumentSlot, basePath = "/tenant/passport"): string {
  if (slot === "govId") return "/verify";
  return `${basePath}?add=${encodeURIComponent(PASSPORT_SLOT_UPLOAD_TYPE[slot])}`;
}
