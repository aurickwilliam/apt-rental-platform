import type { ComponentType } from "react";
import {
  IconAddressBook,
  IconBriefcase2,
  IconCertificate,
  IconFingerprint,
  IconFileCertificate,
  type IconProps,
} from "@tabler/icons-react-native";

const DOCUMENT_TYPE_ICONS: Record<string, ComponentType<IconProps>> = {
  "Proof of Income": IconBriefcase2,
  "Proof of Residency": IconAddressBook,
  "Birth Certificate": IconCertificate,
  "NBI Clearance": IconFingerprint,
  "Certificate of Employment": IconFileCertificate,
};

export function getDocumentTypeIcon(docType: string): ComponentType<IconProps> {
  return DOCUMENT_TYPE_ICONS[docType] ?? IconFileCertificate;
}
