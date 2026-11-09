export type LegalBlock =
  | { type: "paragraph" | "subheading"; text: string }
  | { type: "list"; items: string[] };

export interface LegalSection {
  id: string;
  title: string;
  intro?: string;
  list?: string[];
  body?: string[];
  blocks?: LegalBlock[];
  callout?: { kind: "info" | "warning"; label: string; text: string };
}

export interface LegalPolicy {
  title: string;
  lastUpdated: string;
  version: string;
  jurisdiction: string;
  contact: { email: string; address: string; hours: string };
  sections: LegalSection[];
}

export const LEGAL_CONTACT = {
  email: "support@apt-rental.ph",
  address: "109 Samson Road corner Caimito Road, Caloocan, Philippines",
  hours: "Monday–Friday, 9:00 AM – 6:00 PM (PHT)",
};
