import type { ComponentType } from "react";
import {
  IconAddressBook,
  IconBriefcase2,
  IconCertificate,
  IconFingerprint,
  IconFileCertificate,
  IconId,
  IconLicense,
  type IconProps,
} from "@tabler/icons-react-native";

const DOCUMENT_TYPE_ICONS: Record<string, ComponentType<IconProps>> = {
  "Proof of Income": IconBriefcase2,
  "Proof of Residency": IconAddressBook,
  "Birth Certificate": IconCertificate,
  "National ID": IconId,
  "NBI Clearance": IconFingerprint,
  "Certificate of Employment": IconFileCertificate,
  "Business Permit": IconLicense,
};

export function getDocumentTypeIcon(docType: string): ComponentType<IconProps> {
  return DOCUMENT_TYPE_ICONS[docType] ?? IconFileCertificate;
}
