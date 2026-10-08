export type ApplicationDocumentPathKey =
  | "gov_id_url"
  | "gov_id_back_url"
  | "proof_of_income_url"
  | "proof_of_billing_url"
  | "nbi_clearance_url";

export interface ApplicationDocumentEntry {
  label: string;
  path: string | null;
  signedUrl: string | null;
  /** Wording shown when the slot has no document. */
  emptyLabel: string;
}

export const NOT_PROVIDED = "Not provided";
export const NOT_PROVIDED_OPTIONAL = "Not provided (optional)";

interface SlotDefinition {
  label: string;
  pathKey: ApplicationDocumentPathKey;
  optional: boolean;
  /** Only listed when present (the back exists only for a verified ID). */
  hideWhenEmpty: boolean;
}

const SLOTS: SlotDefinition[] = [
  { label: "Government ID", pathKey: "gov_id_url", optional: false, hideWhenEmpty: false },
  { label: "Government ID (Back)", pathKey: "gov_id_back_url", optional: false, hideWhenEmpty: true },
  { label: "Proof of Income", pathKey: "proof_of_income_url", optional: false, hideWhenEmpty: false },
  { label: "Proof of Billing", pathKey: "proof_of_billing_url", optional: false, hideWhenEmpty: false },
  { label: "NBI Clearance", pathKey: "nbi_clearance_url", optional: true, hideWhenEmpty: false },
];

export const APPLICATION_DOCUMENT_PATH_KEYS: readonly ApplicationDocumentPathKey[] = SLOTS.map((slot) => slot.pathKey);

/**
 * Every document slot of an application in display order, including empty
 * ones, so a missing optional document reads "Not provided (optional)"
 * instead of disappearing.
 */
export function buildApplicationDocumentList(
  paths: Partial<Record<ApplicationDocumentPathKey, string | null>>,
  urls: Record<string, string | null>,
): ApplicationDocumentEntry[] {
  return SLOTS.flatMap((slot) => {
    const path = paths[slot.pathKey] ?? null;
    if (!path && slot.hideWhenEmpty) return [];
    return [
      {
        label: slot.label,
        path,
        signedUrl: path ? (urls[path] ?? null) : null,
        emptyLabel: slot.optional ? NOT_PROVIDED_OPTIONAL : NOT_PROVIDED,
      },
    ];
  });
}
