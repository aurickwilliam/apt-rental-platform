import {
  IconAddressBook,
  IconId,
  IconBriefcase2,
  IconBuildingStore,
  IconCertificate,
  IconFileCertificate,
  IconFileDescription,
  IconFileInvoice,
  IconHomeCheck,
  IconSignature,
  IconFingerprint,
  type Icon,
} from "@tabler/icons-react";

// Same glyphs as mobile `app/document-id/utils/documentTypeIcons.ts`.
const DOCUMENT_TYPE_ICONS: Record<string, Icon> = {
  "Proof of Income": IconBriefcase2,
  "Proof of Residency": IconAddressBook,
  "Birth Certificate": IconCertificate,
  "NBI Clearance": IconFingerprint,
  "Certificate of Employment": IconFileCertificate,
  "Tax Declaration": IconFileDescription,
  "Transfer Certificate of Title": IconHomeCheck,
  "Real Property Tax Receipt": IconFileInvoice,
  "Business Permit": IconBuildingStore,
  "DTI / SEC Registration": IconBuildingStore,
  "Authorization Letter (SPA)": IconSignature,
};

interface DocumentTypeIconProps {
  docType: string;
  size: number;
  /** Verification-linked IDs show the ID glyph whatever their doc type. */
  isIdentity?: boolean;
}

export function DocumentTypeIcon({ docType, size, isIdentity = false }: DocumentTypeIconProps) {
  const Glyph = isIdentity ? IconId : (DOCUMENT_TYPE_ICONS[docType] ?? IconFileCertificate);
  return <Glyph size={size} aria-hidden="true" />;
}

/** Whether a stored document renders as an inline image (MIME wins over path). */
export function isImageDocument(mimeType: string | null | undefined, path: string): boolean {
  if (mimeType) return mimeType.toLowerCase().startsWith("image/");
  return /\.(jpe?g|png|webp)$/i.test(path);
}
