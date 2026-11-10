/**
 * The APT Passport wallet: the page shell, the verified ID card, the
 * application-readiness checklist, the document cards, the add/replace
 * upload flow and the verification activity timeline.
 */
export const passport = {
  "passport.title": "APT Passport",
  "passport.back": "APT Passport",
  "passport.subtitle.tenant":
    "Your verified ID and supporting documents, attached automatically when you apply.",
  "passport.subtitle.landlord":
    "Your verified ID and ownership documents. They show tenants you are a legitimate landlord.",
  "passport.loadingDocuments": "Loading documents…",
  "passport.loadingDocument": "Loading document…",

  "passport.card.meta": "Added {date} · {expiry}",
  "passport.card.expires": "Expires {date}",
  "passport.card.noExpiry": "No expiry",

  "passport.picker.intro.tenant":
    "Choose the type of document you want to add.",
  "passport.picker.intro.landlord":
    "Choose the document that proves you own or are authorized to rent out your properties.",
  "passport.picker.reviewHintBefore": "Types with a",
  "passport.picker.reviewHintAfter":
    "can be sent for review after you add them. Your government ID is added automatically once your account verification is approved.",
  "passport.picker.shieldLabel": "shield",
  "passport.picker.alreadyAdded":
    "Already added. Open it from your wallet to replace the file.",
  "passport.picker.canBeVerified": "Can be verified",

  "passport.id.title": "Government ID",
  "passport.id.autoLinked":
    "Your ID is linked automatically from your approved account verification.",
  "passport.id.enlargeAria": "Enlarge the {side} of your ID",
  "passport.id.alt": "{idType} ({side})",
  "passport.id.previewUnavailable": "Preview unavailable",
  "passport.id.showFront": "Show front of ID",
  "passport.id.showBack": "Show back of ID",
  "passport.id.side.front": "front",
  "passport.id.side.back": "back",

  "passport.readiness.title": "Application documents",
  "passport.readiness.ready": "Ready to apply",
  "passport.readiness.notReady": "Not ready yet",
  "passport.readiness.hint.required": "Required",
  "passport.readiness.hint.income":
    "Required unless you're a student or unemployed",
  "passport.readiness.hint.optional": "Optional",
  "passport.readiness.expired": "Expired. Upload a current copy.",
  "passport.readiness.addAria": "Add {slot}",
  "passport.readiness.add": "Add",
  "passport.readiness.verify": "Verify",

  "passport.profile.verified": "Your identity has been verified.",
  "passport.profile.pending":
    "Your identity verification is under review.",
  "passport.profile.rejected":
    "Verification unsuccessful. Review the result and resubmit.",
  "passport.profile.unverified": "Verify your identity to get started.",
  "passport.profile.open": "Open Passport",
  "passport.profile.apply": "Apply for Verification",
  "passport.profile.reapply": "Re-Apply for Verification",

  "passport.activity.loading": "Loading verification progress",

  "passport.loadError.title": "Couldn't load your documents",
  "passport.loadError.retry": "Try Again",

  "passport.supporting.title": "Supporting documents",
  "passport.supporting.count": "{count} document",
  "passport.supporting.countPlural": "{count} documents",
  "passport.supporting.layoutAria": "Document layout",
  "passport.supporting.gridView": "Grid view",
  "passport.supporting.listView": "List view",
  "passport.supporting.emptyTitle": "No supporting documents yet",
  "passport.supporting.emptyBody.tenant":
    "Add payslips, billing statements, or clearances so they're ready when you apply for an apartment. Documents are only shared with landlords you apply to.",
  "passport.supporting.emptyBody.landlord":
    "Add your tax declaration, land title, business permit or other ownership documents so tenants can trust your listings. Our team reviews them to confirm you are a legitimate landlord.",
  "passport.supporting.addDocument": "Add a Document",
  "passport.supporting.add": "Add document",
  "passport.toast.added": "{type} added",

  "passport.upload.expiryPast": "Expiry date cannot be in the past.",
  "passport.upload.legalNotice":
    "By uploading your documents, you certify that all information is true and valid. Any fraudulent or falsified documents may result in account suspension and legal action in accordance with applicable Philippine laws on fraud and identity theft, including the Cybercrime Prevention Act (Republic Act No. 10175).",
  "passport.upload.add": "Add Document",
  "passport.upload.adding": "Adding…",
  "passport.upload.saveError":
    "Could not save your document. Please try again.",
  "passport.upload.fileHint": "JPG, PNG, WebP, or PDF, up to 5 MB",
  "passport.upload.reviewHint":
    "Can be verified: request a review from the document's page after adding it.",
  "passport.upload.document": "Document",
  "passport.upload.chooseAria": "Choose your {type} file",
  "passport.upload.replaceAria": "Replace {name}",
  "passport.upload.chooseFile": "Choose a file",
  "passport.upload.previewAlt": "{type} preview",
  "passport.upload.remove": "Remove",
  "passport.upload.expiryLabel": "Expiry date (optional)",
  "passport.upload.clearExpiry": "Clear expiry date",
  "passport.upload.calendarAria": "Expiry date",
  "passport.upload.confirm":
    "I confirm that the information provided is true and the document belongs to me.",
  "passport.upload.certify":
    "By uploading, you confirm this document is valid and belongs to you. Fraudulent documents may lead to account suspension.",
  "passport.upload.legalNoticeTitle": "Legal notice",
  "passport.upload.cancel": "Cancel",
  "passport.upload.gotIt": "Got it",

  "passport.add.documentTypes": "Document types",
  "passport.add.title": "Add a document",
  "passport.add.alreadyAdded":
    "You already added a {type}. Open it from your wallet to replace the file.",
  "passport.add.identity":
    "Identity documents use live ID capture and a selfie in account verification. Once approved, your ID is added to your APT Passport automatically.",
  "passport.add.unavailable":
    "This document type is not available for Passport uploads. Choose a type from the list instead.",
  "passport.add.goVerify": "Go to ID verification",
  "passport.add.chooseType": "Choose document type",

  "passport.replace.title": "Replace {type}",
  "passport.replace.submit": "Replace Document",
  "passport.replace.pending": "Replacing…",
  "passport.replace.wasChecked":
    "Replacing this document sets it back to not verified. You'll need to request verification again.",
  "passport.replace.notice": "The new file replaces the current one.",

  "passport.detail.loadError": "Couldn't load this document",
  "passport.detail.notFound": "Document not found",
  "passport.detail.deleted": "This document may have been deleted.",
  "passport.detail.backToDocuments": "Back to Documents",
  "passport.detail.reviewRequested":
    "Verification requested. We'll notify you once an admin has checked it.",
  "passport.detail.reviewError":
    "Could not request review. Please try again.",
  "passport.detail.replaced": "{type} replaced. It is not verified yet.",
  "passport.detail.deletedToast": "Document deleted",
  "passport.detail.deleteError":
    "Could not delete this document. Please try again.",
  "passport.detail.previewAria": "Document preview",
  "passport.detail.enlargeAria": "Enlarge {type} {side}",
  "passport.detail.openAria": "Open {type} file",
  "passport.detail.previewUnavailable": "Preview unavailable",
  "passport.detail.openFile": "Open file",
  "passport.detail.linkedId":
    "This ID is linked to your approved account verification and is managed automatically.",
  "passport.detail.uploaded": "Uploaded",
  "passport.detail.expiryDate": "Expiry date",
  "passport.detail.noExpiry": "No expiry",
  "passport.detail.expiredSuffix": "(Expired)",
  "passport.detail.notVerified": "Not verified",
  "passport.detail.notVerifiedBody":
    "An admin could not verify this document.",
  "passport.detail.expiredTitle": "Expired document",
  "passport.detail.expiredBody":
    "Upload a current copy before requesting verification.",
  "passport.detail.underReviewTitle": "Under admin review",
  "passport.detail.underReviewBody":
    "We'll notify you once an admin has checked this document.",
  "passport.detail.replace": "Replace Document",
  "passport.detail.requestAgain": "Request Review Again",
  "passport.detail.request": "Request Verification",
  "passport.detail.delete": "Delete Document",
  "passport.detail.deleteTitle": "Delete document?",
  "passport.detail.deleteBody":
    "This document will be permanently removed from your passport. Documents attached to an active application cannot be deleted.",
  "passport.detail.keep": "Keep",
  "passport.detail.deleteConfirm": "Delete",
  "passport.detail.deleting": "Deleting…",

  "passport.timeline.title": "Verification progress",
  "passport.timeline.verified": "Identity verified",
  "passport.timeline.rejected": "Verification rejected",
  "passport.timeline.awaiting": "Awaiting review",
  "passport.timeline.awaitingCaption":
    "We'll notify you when verification is complete.",
  "passport.timeline.submitted": "Documents submitted",
  "passport.timeline.completed": "{date} · Completed",

  "passport.docType.proofOfIncome.description":
    "Show your earnings as proof of income for rental applications.",
  "passport.docType.proofOfResidency.description":
    "Confirm your address when an application asks for proof of billing or residency.",
  "passport.docType.birthCertificate.description":
    "Keep an additional identity record in your APT Passport.",
  "passport.docType.nbiClearance.description":
    "Keep a current clearance ready when a rental application requests one.",
  "passport.docType.nbiClearance.landlordDescription":
    "Show a current clearance so tenants can trust you are a legitimate lessor.",
  "passport.docType.certificateOfEmployment.description":
    "Confirm your employment as proof of income for rental applications.",
  "passport.docType.payslip.description":
    "Show recent salary payments as proof of income for rental applications.",
  "passport.docType.incomeTaxReturn.description":
    "Show your declared annual income as proof of income for rental applications.",
  "passport.docType.taxDeclaration.description":
    "Show the property is declared for tax in your name or the owner's, to prove you are a legitimate lessor.",
  "passport.docType.transferCertificateOfTitle.description":
    "Prove ownership of the property you rent out with its land title.",
  "passport.docType.realPropertyTaxReceipt.description":
    "Show a current real property tax payment for the property you list.",
  "passport.docType.businessPermit.description":
    "Show your Mayor's or business permit if you rent out properties as a business.",
  "passport.docType.dtiSecRegistration.description":
    "Show your DTI or SEC registration if you rent out as a registered business.",
  "passport.docType.authorizationLetterSpa.description":
    "Show the owner's authorization if you manage or lease the property on their behalf.",
  "passport.docType.unknown.description":
    "Keep this document in your APT Passport for your own records.",
};
