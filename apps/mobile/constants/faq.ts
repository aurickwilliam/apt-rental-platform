// Settings → FAQs. Every answer names the exact control the app shows
// (Pay Now, Request Maintenance, View document, Message landlord, Add Property,
// Apply for Verification) so the page cannot drift from the flows it describes.
export const FAQ_ITEMS = [
  {
    id: "pay-rent",
    question: "How do I pay my rent?",
    answer:
      "Open the Rentals tab and tap Pay Now on your current rent card, then choose a method your landlord accepts. Online checkout (GCash, Maya, QRPh, bank transfer or card) currently runs in test mode and does not process real money; cash payments stay pending until your landlord confirms them.",
  },
  {
    id: "maintenance",
    question: "How do I submit a maintenance request?",
    answer:
      "Open the Rentals tab, find the Maintenance card and tap Request Maintenance. Describe the issue, set how urgent it is and submit. Your landlord is notified and can respond inside APT.",
  },
  {
    id: "lease",
    question: "How do I view my lease agreement?",
    answer:
      "Once your landlord uploads it, open the Signed Lease card on the Rentals tab and tap View document. After reading it, tap I've reviewed this lease to confirm you have read it.",
  },
  {
    id: "landlord",
    question: "How do I contact my landlord?",
    answer:
      "Use the Chat tab, tap Message landlord in Quick Actions on the Rentals tab, or use the message button on your landlord card.",
  },
  {
    id: "list-property",
    question: "How do I list my property?",
    answer:
      "Switch to the Landlord portal from your Profile if needed, open the Units tab and tap Add Property. Add the CAMANAVA address, rent and deposit terms, amenities and photos, then publish the listing. Your account must be verified first.",
  },
  {
    id: "verify-account",
    question: "How do I verify my account?",
    answer:
      "Open the Profile tab, find Verification Status and tap Apply for Verification. You will capture a valid government ID and take a selfie. Once approved, your verified status appears on your profile and APT Passport.",
  },
] as const;
