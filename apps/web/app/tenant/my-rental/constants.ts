import type {
  AppStepItem,
  MaintenanceItem,
  Message,
  PaymentHistoryItem,
} from "./types";

export const PENDING_PAYMENT = {
  total: 8500,
  month: "May 2025",
  dueDate: "May 1, 2025",
  breakdown: [
    { label: "Base rent", amount: 7500 },
    { label: "Association dues", amount: 500 },
    { label: "Water bill", amount: 300 },
    { label: "Electricity", amount: 200 },
  ],
};

export const PAYMENT_HISTORY: PaymentHistoryItem[] = [
  { id: "1", date: "Apr 1, 2025", description: "April 2025 — Monthly rent", amount: 8500, status: "paid" },
  { id: "2", date: "Mar 1, 2025", description: "March 2025 — Monthly rent", amount: 8500, status: "paid" },
  { id: "3", date: "Feb 1, 2025", description: "February 2025 — Monthly rent", amount: 8500, status: "paid" },
  { id: "4", date: "Jan 5, 2025", description: "January 2025 — Monthly rent", amount: 8500, status: "late" },
  { id: "5", date: "Jan 1, 2025", description: "Security deposit", amount: 17000, status: "paid" },
];

export const MAINTENANCE_ITEMS: MaintenanceItem[] = [
  { id: "1", title: "Leaky faucet — Kitchen", subtitle: "Plumber scheduled for Apr 26", status: "in_progress" },
  { id: "2", title: "Broken window latch", subtitle: "Resolved on Apr 18", status: "resolved" },
  { id: "3", title: "Ceiling paint peeling", subtitle: "Submitted Apr 22 · Awaiting review", status: "pending" },
];

export const MESSAGES: Message[] = [
  { id: "1", sender: "Ramon Lacson", initials: "RL", preview: "Just wanted to confirm the plumber visit…", time: "10:32 AM", unread: true },
  { id: "2", sender: "APT Support", initials: "AP", preview: "Your maintenance ticket has been updated.", time: "Apr 22", unread: false },
  { id: "3", sender: "Ramon Lacson", initials: "RL", preview: "Thanks for reporting the issue quickly!", time: "Apr 18", unread: false },
];

export const APP_STEPS: AppStepItem[] = [
  { label: "Application submitted", status: "done" },
  { label: "Documents verified", status: "done" },
  { label: "Background check", status: "active" },
  { label: "Landlord decision", status: "pending" },
];

export const CALENDAR_DAYS: (number | null)[] = [
  null, null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
];
