import type { ComponentType } from "react";
import {
  IconAddressBook,
  IconBriefcase2,
  IconBuildingStore,
  IconCertificate,
  IconFingerprint,
  IconFileCertificate,
  IconFileDescription,
  IconFileInvoice,
  IconHomeCheck,
  IconSignature,
  type IconProps,
} from "@tabler/icons-react-native";

const DOCUMENT_TYPE_ICONS: Record<string, ComponentType<IconProps>> = {
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

export function getDocumentTypeIcon(docType: string): ComponentType<IconProps> {
  return DOCUMENT_TYPE_ICONS[docType] ?? IconFileCertificate;
}
