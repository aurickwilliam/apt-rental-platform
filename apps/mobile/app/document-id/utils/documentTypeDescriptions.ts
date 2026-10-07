const DOCUMENT_TYPE_DESCRIPTIONS: Record<string, string> = {
  "Proof of Income":
    "Show your earnings as proof of income for rental applications.",
  "Proof of Residency":
    "Confirm your address when an application asks for proof of billing or residency.",
  "Birth Certificate":
    "Keep an additional identity record in your APT Passport.",
  "NBI Clearance":
    "Keep a current clearance ready when a rental application requests one.",
  "Certificate of Employment":
    "Confirm your employment as proof of income for rental applications.",
  Payslip: "Show recent salary payments as proof of income for rental applications.",
  "Income Tax Return (ITR)":
    "Show your declared annual income as proof of income for rental applications.",
};

export function getDocumentTypeDescription(docType: string): string {
  return (
    DOCUMENT_TYPE_DESCRIPTIONS[docType] ??
    "Keep this document in your APT Passport for your own records."
  );
}
