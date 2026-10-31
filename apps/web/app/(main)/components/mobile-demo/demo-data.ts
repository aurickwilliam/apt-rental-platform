/** Fictional display fixtures only. Never derive these from a session or a service. */
export const DEMO_VIEWPORT = { width: 412, height: 915, topInset: 28, bottomInset: 24 } as const;
export const DEMO_HERO_HEIGHT = DEMO_VIEWPORT.topInset + Math.max(200, Math.round(DEMO_VIEWPORT.height * 0.25));

export const DEMO_SCREENS = [
  { id: "rentals", label: "Rentals dashboard" },
  { id: "payments", label: "Payment History" },
  { id: "messages", label: "Messages" },
  { id: "conversation", label: "Conversation" },
] as const;

export type DemoScreen = (typeof DEMO_SCREENS)[number]["id"];
export type DemoStatus = "Paid" | "Pending" | "In Progress" | "Resolved";

export const DEMO_RENTAL = {
  name: "Maple Studio",
  address: "18 Sample Street, Karuhatan, Valenzuela, Metro Manila, 1441",
  // Existing marketing photograph, not a tenant's uploaded apartment image.
  cover: "/landing/hero-living-room.png",
  landlord: "Elena Santos",
  initials: "ES",
  rent: "₱12,000",
  period: "October 2026",
  dueDate: "Oct 5, 2026",
} as const;

export const DEMO_PAYMENTS = [
  { id: "demo-payment-1", month: "September 2026", amount: "₱12,000", method: "GCash", status: "Paid", year: "2026" },
  { id: "demo-payment-2", month: "August 2026", amount: "₱12,000", method: "Cash", status: "Paid", year: "2026" },
  { id: "demo-payment-3", month: "July 2026", amount: "₱12,000", method: "GCash", status: "Paid", year: "2026" },
  { id: "demo-payment-4", month: "June 2026", amount: "₱12,000", method: "Cash", status: "Paid", year: "2026" },
  { id: "demo-payment-5", month: "May 2026", amount: "₱12,000", method: "GCash", status: "Paid", year: "2026" },
  { id: "demo-payment-6", month: "December 2025", amount: "₱12,000", method: "Cash", status: "Paid", year: "2025" },
] as const;

export const DEMO_CONVERSATIONS = [
  { id: "demo-thread-1", name: DEMO_RENTAL.landlord, initials: "ES", apartment: DEMO_RENTAL.name, preview: "Thank you, see you on Thursday!", timestamp: "10m ago", pinned: true, unread: 0, sent: true },
  { id: "demo-thread-2", name: "Marco Reyes", initials: "MR", apartment: "Cedar Apartments", preview: "The unit is available for viewing.", timestamp: "2h ago", pinned: false, unread: 2, sent: false },
  { id: "demo-thread-3", name: "Ana Cruz", initials: "AC", apartment: "Willow Residence", preview: "Thank you for your interest!", timestamp: "Yesterday", pinned: false, unread: 0, sent: false },
] as const;

export const DEMO_MESSAGES = [
  { id: "demo-message-1", sent: false, text: "Hi! Just checking if everything is okay with the studio." },
  { id: "demo-message-2", sent: true, text: "Hi Ms. Elena! Everything is good, thank you." },
  { id: "demo-message-3", sent: true, text: "I noticed a small leak under the kitchen sink." },
  { id: "demo-message-4", sent: false, text: "Thank you for letting me know. I can arrange a plumber for Thursday." },
  { id: "demo-message-5", sent: false, text: "Would 10 AM work for you?" },
  { id: "demo-message-6", sent: true, text: "Yes, that works. I've added the details in Maintenance too." },
  { id: "demo-message-7", sent: false, text: "Perfect. I'll confirm the schedule with the plumber." },
  { id: "demo-message-8", sent: true, text: "Thank you, see you on Thursday!" },
] as const;
