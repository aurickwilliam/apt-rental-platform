const DOCUMENT_TYPE_DESCRIPTIONS: Record<string, string> = {
  'Proof of Income':
    'Show your earnings as proof of income for rental applications.',
  'Proof of Residency':
    'Confirm your address when an application asks for proof of billing or residency.',
  'Birth Certificate':
    'Keep an additional identity record in your APT Passport.',
  'NBI Clearance':
    'Keep a current clearance ready when a rental application requests one.',
  'Certificate of Employment':
    'Confirm your employment as proof of income for rental applications.',
  Payslip: 'Show recent salary payments as proof of income for rental applications.',
  'Income Tax Return (ITR)':
    'Show your declared annual income as proof of income for rental applications.',
  'Tax Declaration':
    'Show the property is declared for tax in your name or the owner’s, to prove you are a legitimate lessor.',
  'Transfer Certificate of Title':
    'Prove ownership of the property you rent out with its land title.',
  'Real Property Tax Receipt':
    'Show a current real property tax payment for the property you list.',
  'Business Permit':
    'Show your Mayor’s or business permit if you rent out properties as a business.',
  'DTI / SEC Registration':
    'Show your DTI or SEC registration if you rent out as a registered business.',
  'Authorization Letter (SPA)':
    'Show the owner’s authorization if you manage or lease the property on their behalf.',
}

const LANDLORD_DESCRIPTION_OVERRIDES: Record<string, string> = {
  'NBI Clearance':
    'Show a current clearance so tenants can trust you are a legitimate lessor.',
}

export function getDocumentTypeDescription(
  docType: string,
  portal: 'tenant' | 'landlord' = 'tenant',
): string {
  return (
    (portal === 'landlord' ? LANDLORD_DESCRIPTION_OVERRIDES[docType] : undefined) ??
    DOCUMENT_TYPE_DESCRIPTIONS[docType] ??
    'Keep this document in your APT Passport for your own records.'
  )
}
