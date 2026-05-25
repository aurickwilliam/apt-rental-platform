import {
  Building2,
  MessageSquare,
  Wallet,
  ClipboardList,
  ShieldCheck,
  BarChart3,
  Wrench,
  Star,
} from "lucide-react";

export const features = [
  {
    key: "listing",
    icon: Building2,
    title: "Property Listing Management",
    description:
      "Post and manage multiple properties in one place. Update availability and track all units in real time.",
    benefits: [
      "Post verified property listings",
      "Edit and remove units anytime",
      "Monitor applications per property",
      "Real-time availability updates",
    ],
  },
  {
    key: "payments",
    icon: Wallet,
    title: "Online Rent Collection",
    description:
      "Tenants pay via GCash, Maya, or bank transfer — every payment tracked automatically.",
    benefits: [
      "Accept GCash & Maya payments",
      "Automatic payment reminders",
      "Instant payment notifications",
      "Full payment history per tenant",
    ],
  },
  {
    key: "messaging",
    icon: MessageSquare,
    title: "Built-in Messaging",
    description:
      "All tenant communication in one place. No more scattered chats across different apps.",
    benefits: [
      "Chat with current and prospective tenants",
      "Respond to inquiries quickly",
      "Organized conversation history",
    ],
  },
  {
    key: "applications",
    icon: ClipboardList,
    title: "Tenant Application Review",
    description:
      "Review applications digitally. View documents, evaluate applicants, accept or reject — all in one tap.",
    benefits: [
      "View legal documents online",
      "Evaluate applicant profiles",
      "Accept or reject with notification",
      "Digital contracts & e-signing",
    ],
  },
  {
    key: "maintenance",
    icon: Wrench,
    title: "Maintenance Request Tracking",
    description:
      "Tenants report issues directly through the app. You're notified immediately.",
    benefits: [
      "Receive instant maintenance reports",
      "Track request status in real time",
      "Permanent record of all issues",
    ],
  },
  {
    key: "analytics",
    icon: BarChart3,
    title: "Profit Analytics & Reports",
    description:
      "Monthly income overview generated automatically. Know exactly how much you're earning.",
    benefits: [
      "Monthly profit overview",
      "Automatic budget calculations",
      "Track delayed or missed payments",
      "Visual charts and summaries",
    ],
  },
  {
    key: "verification",
    icon: ShieldCheck,
    title: "Verified Tenant System",
    description:
      "Every tenant is verified through a valid Philippine ID and selfie before they can apply.",
    benefits: [
      "Valid Philippine ID verification",
      "Selfie identity matching",
      "Reduced risk of rental scams",
      "Admin-reviewed tenant accounts",
    ],
  },
  {
    key: "insights",
    icon: Star,
    title: "Property Performance Insights",
    description:
      "See ratings and reviews from tenants so you always know how your property is perceived.",
    benefits: [
      "View tenant ratings & reviews",
      "Track property engagement",
      "Improve listing quality",
      "Build trust with verified reviews",
    ],
  },
];

export const challenges = [
  {
    pain: "You check your phone every due date just to see if they paid.",
    relief: "Payments come in automatically. You'll know the moment it clears.",
  },
  {
    pain: "Paper receipts get lost. Disputes have no paper trail.",
    relief: "Every transaction is logged, timestamped, and always accessible.",
  },
  {
    pain: "Maintenance issues only reach you when it's already a big problem.",
    relief: "Tenants report issues early. You track them to resolution.",
  },
];

export const steps = [
  {
    number: "01",
    title: "Create your account",
    description: "Sign up with a valid Philippine ID. Approved within 24 hours.",
  },
  {
    number: "02",
    title: "List your property",
    description:
      "Upload photos, set your price, publish. Verified tenants can apply right away.",
  },
  {
    number: "03",
    title: "Choose your tenant",
    description:
      "Review applications, check documents, chat, and accept with one tap.",
  },
  {
    number: "04",
    title: "Let APT handle the rest",
    description: "Rent, maintenance, messaging — all in one place. No daily grind.",
  },
];

export const testimonials = [
  {
    name: "Mija Santos",
    role: "Owner · 3 units, Caloocan",
    initials: "MS",
    quote:
      "Medyo nahirapan ako sa simula kasi hindi ako tech-savvy, pero nag-adjust din. Yung GCash collection ang pinakamalaking tulong — wala na akong pinapadala na account number every month.",
    rating: 4,
  },
  {
    name: "Aurick Cruz",
    role: "Owner · 6 units, Valenzuela",
    initials: "AC",
    quote:
      "Skeptical ako dati sa ganito. Pero yung ID verification ng tenants, that actually matters pag 6 units ka na — hindi mo na kilala lahat personally.",
    rating: 5,
  },
  {
    name: "Ron Reyes",
    role: "Owner · 2 units, Navotas",
    initials: "RR",
    quote:
      "Sana may lease expiry reminder pa para sa landlord side. But overall okay na — yung maintenance reporting maganda. Naiwasan ko isang malaking repair kasi na-report ng tenant ng maaga.",
    rating: 4,
  },
];