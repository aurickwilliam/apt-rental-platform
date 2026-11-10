import {
  PASSPORT_DOC_TYPE_DESCRIPTION_KEYS,
  type TranslationKey,
} from "@repo/i18n";

/** Landlord wording that differs from the tenant copy for the same type. */
const LANDLORD_DESCRIPTION_KEYS: Record<string, TranslationKey> = {
  "NBI Clearance": "passport.docType.nbiClearance.landlordDescription",
};

/**
 * Catalog key for a stored document type's one-line description. Mirrors
 * `getDocumentTypeDescription` in `@repo/passport`, which stays language-free
 * for mobile until its own slice lands.
 */
export function documentTypeDescriptionKey(
  docType: string,
  portal: "tenant" | "landlord" = "tenant",
): TranslationKey {
  return (
    (portal === "landlord" ? LANDLORD_DESCRIPTION_KEYS[docType] : undefined) ??
    PASSPORT_DOC_TYPE_DESCRIPTION_KEYS[docType] ??
    "passport.docType.unknown.description"
  );
}
