export const BRAND = {
  email: "support@apt-rental.ph",
  address: "109 Samson Road corner Caimito Road, Caloocan, Philippines",
  hours: "Monday–Friday, 9:00 AM – 6:00 PM (PHT)",
};

export const LEGAL_META = {
  lastUpdated: "October 29, 2026",
  jurisdiction: "Effective in the Philippines",
  version: "1.1",
};

export type Callout = { kind: "info" | "warning"; label: string; text: string };

export type Section = {
  id: string;
  num: string;
  title: string;
  emphasis: string; // the italic/blue word(s) at the end of the title
  intro?: string;
  list?: string[];
  body?: string[]; // paragraphs after the list
  callout?: Callout;
};

export const TOC: { id: string; label: string }[] = [
  { id: "s1", label: "Acceptance of Terms" },
  { id: "s2", label: "About APT" },
  { id: "s3", label: "Eligibility" },
  { id: "s4", label: "User Accounts" },
  { id: "s5", label: "Identity Verification" },
  { id: "s6", label: "Services for Tenants" },
  { id: "s7", label: "Services for Rental Owners" },
  { id: "s8", label: "Property Listings" },
  { id: "s9", label: "Rental Applications" },
  { id: "s10", label: "Rental Agreements" },
  { id: "s11", label: "Payments" },
  { id: "s12", label: "Maintenance Requests" },
  { id: "s13", label: "Reviews & Ratings" },
  { id: "s14", label: "Prohibited Activities" },
  { id: "s15", label: "Intellectual Property" },
  { id: "s16", label: "Privacy and Data Protection" },
  { id: "s17", label: "Suspension & Termination" },
  { id: "s18", label: "Disclaimer" },
  { id: "s19", label: "Limitation of Liability" },
  { id: "s20", label: "Governing Law" },
  { id: "s21", label: "Changes to These Terms" },
  { id: "s22", label: "Compliance with PH Rental Laws" },
];

export const SECTIONS: Section[] = [
  {
    id: "s1",
    num: "Section 01",
    title: "Acceptance of",
    emphasis: "Terms",
    body: [
      `Welcome to APT (A Place to Thrive). These Terms and Conditions ("Terms") govern your access to and use of the APT website and mobile application ("Platform"). By creating an account, accessing, or using the Platform, you acknowledge that you have read, understood, and agree to comply with these Terms.`,
    ],
    callout: {
      kind: "info",
      label: "Note",
      text: `If you do not agree with these Terms, you must discontinue use of the Platform immediately.`,
    },
  },
  {
    id: "s2",
    num: "Section 02",
    title: "About",
    emphasis: "APT",
    intro: "The Platform allows users to:",
    list: [
      "Search apartments",
      "List rental properties",
      "Submit rental applications",
      "Book property visits",
      "Communicate through in-app messaging",
      "Track rental payments",
      "Submit maintenance requests",
      "Review and rate properties",
    ],
    body: [
      "APT serves only as an intermediary platform and is not a property owner, real estate broker, or property management company.",
    ],
  },
  {
    id: "s3",
    num: "Section 03",
    title: "",
    emphasis: "Eligibility",
    intro: "To use APT, users must meet the following requirements:",
    list: [
      "Be at least eighteen (18) years old.",
      "Provide accurate, complete, and truthful personal information.",
      "Complete the required identity verification process.",
      "Have the legal capacity to enter into rental agreements.",
      "Comply with applicable Philippine laws and platform policies.",
    ],
    body: [
      "Users who provide false information or fraudulent documents may have their accounts suspended or permanently terminated.",
    ],
  },
  {
    id: "s4",
    num: "Section 04",
    title: "User",
    emphasis: "Accounts",
    intro: "Users are responsible for:",
    list: [
      "Maintaining the confidentiality of their account credentials",
      "Ensuring that all information remains accurate",
      "Immediately reporting unauthorized account access",
    ],
    callout: {
      kind: "info",
      label: "Note",
      text: "APT reserves the right to suspend accounts involved in fraudulent or suspicious activities.",
    },
  },
  {
    id: "s5",
    num: "Section 05",
    title: "Identity",
    emphasis: "Verification",
    intro:
      "To improve trust and reduce rental scams, APT requires identity verification. Verification may include:",
    list: [
      "Government-issued Philippine ID",
      "Selfie verification",
      "Additional verification documents when necessary",
    ],
    callout: {
      kind: "info",
      label: "Important",
      text: "Providing forged or altered documents will result in immediate account suspension.",
    },
  },
  {
    id: "s6",
    num: "Section 06",
    title: "Services for",
    emphasis: "Tenants",
    intro: "Tenants may use the Platform to:",
    list: [
      "Browse available apartments",
      "Filter apartments by location, price, amenities, and other preferences",
      "View property information",
      "Schedule property visits",
      "Submit rental applications",
      "Upload required documents",
      "Pay rent through supported payment methods",
      "Communicate with rental owners",
      "Submit maintenance requests",
      "Leave reviews after occupying a property",
    ],
  },
  {
    id: "s7",
    num: "Section 07",
    title: "Services for",
    emphasis: "Rental Owners",
    intro: "Rental owners may use the Platform to:",
    list: [
      "Create verified property listings",
      "Upload property photos and descriptions",
      "Receive rental applications",
      "Review submitted documents",
      "Accept or reject applicants",
      "Track rental payments",
      "Respond to maintenance requests",
      "Communicate with tenants",
      "View rental performance and analytics",
    ],
    body: [
      "Rental owners are solely responsible for ensuring that all listings are accurate, lawful, and up to date.",
    ],
  },
  {
    id: "s8",
    num: "Section 08",
    title: "Property",
    emphasis: "Listings",
    intro: "Rental owners agree that every listing must:",
    list: [
      "Represent a real property",
      "Contain truthful descriptions",
      "Display accurate rental prices",
      "Include genuine photographs",
      "Clearly disclose rental rules and policies",
    ],
    body: ["APT may remove listings that are false, misleading, fraudulent, duplicated, or already unavailable."],
  },
  {
    id: "s9",
    num: "Section 09",
    title: "Rental",
    emphasis: "Applications",
    body: ["Submitting a rental application does not guarantee acceptance."],
    intro: "Rental owners have the sole discretion to:",
    list: ["Review applications", "Request additional information", "Accept or reject applicants"],
    callout: {
      kind: "info",
      label: "Please note",
      text: "APT is not responsible for decisions made by rental owners.",
    },
  },
  {
    id: "s10",
    num: "Section 10",
    title: "Rental",
    emphasis: "Agreements",
    body: [
      "Rental agreements made through APT are solely between the tenant and the rental owner.",
      "APT's Terms and Conditions govern the use of the platform and are separate from the rental agreement established between the tenant and rental owner.",
      "Both parties are responsible for understanding and following the terms of their rental agreement, including rental duration, monthly payments, security deposits, and other agreed conditions.",
      "APT serves as a platform for facilitating rental transactions and is not a party to the rental agreement. Disputes regarding rental agreements shall be resolved between the parties involved, subject to applicable laws.",
    ],
  },
  {
    id: "s11",
    num: "Section 11",
    title: "",
    emphasis: "Payments",
    intro: "APT allows tenants and rental owners to monitor rental payments and may facilitate online transactions through supported payment providers. Users acknowledge that:",
    list: [
      "Monthly rental payments must follow the agreed payment schedule stated in the rental agreement.",
      "Rental amounts, payment deadlines, and any applicable penalties must be clearly communicated by the rental owner.",
      "Security deposit amounts, permitted deductions, and refund conditions must be specified in the rental agreement and comply with applicable Philippine laws.",
      "Payment confirmation may require processing time, depending on the selected payment method.",
      "Refund requests and payment disputes shall be handled according to the rental agreement and applicable laws.",
      "APT is not responsible for delays caused by third-party payment providers or banking services, except where responsibility is imposed by law.",
    ],
  },
  {
    id: "s12",
    num: "Section 12",
    title: "Maintenance",
    emphasis: "Requests",
    body: ["Tenants may submit maintenance requests through the Platform. Rental owners remain solely responsible for:"],
    list: ["Evaluating requests", "Scheduling repairs", "Completing maintenance work"],
    callout: {
      kind: "info",
      label: "Please note",
      text: "APT only provides the communication platform — it does not perform or guarantee maintenance work.",
    },
  },
  {
    id: "s13",
    num: "Section 13",
    title: "Reviews and",
    emphasis: "Ratings",
    intro: "Only tenants with actual rental experience may submit reviews. Users agree that reviews must:",
    list: ["Be truthful", "Be respectful", "Not contain offensive language", "Not contain false accusations"],
    body: ["APT reserves the right to remove reviews that violate these Terms."],
  },
  {
    id: "s14",
    num: "Section 14",
    title: "Prohibited",
    emphasis: "Activities",
    intro: "Users must not:",
    list: [
      "Create fake accounts",
      "Upload forged identification",
      "Post fraudulent listings",
      "Harass other users",
      "Upload malicious software",
      "Attempt unauthorized access",
      "Use automated bots without authorization",
      "Interfere with the Platform's operations",
      "Violate Philippine laws",
    ],
    callout: {
      kind: "warning",
      label: "Warning",
      text: "Violation may result in suspension or permanent account termination.",
    },
  },
  {
    id: "s15",
    num: "Section 15",
    title: "Intellectual",
    emphasis: "Property",
    body: [
      "All software, graphics, logos, interface, and content created by APT remain the intellectual property of the developers unless otherwise stated.",
      "Users retain ownership of the content they upload but grant APT permission to display such content for Platform operations.",
    ],
  },
  {
    id: "s16",
    num: "Section 16",
    title: "Privacy and",
    emphasis: "Data Protection",
    intro: "APT collects and processes personal information necessary for the operation of the platform, including:",
    list: [
      "Account registration and management.",
      "Identity verification.",
      "Rental applications and document submissions.",
      "Payment processing and monitoring.",
      "Communication between tenants and rental owners.",
      "Platform security and fraud prevention.",
    ],
    body: [
      "Personal information and uploaded documents shall be handled in accordance with the APT Privacy Policy and applicable Philippine data protection laws.",
      "Users are encouraged to review the Privacy Policy to understand how their personal information is collected, used, stored, shared, and protected.",
    ],
  },
  {
    id: "s17",
    num: "Section 17",
    title: "Suspension and",
    emphasis: "Termination",
    intro: "APT reserves the right to suspend or terminate accounts that:",
    list: [
      "Violate these Terms",
      "Commit fraud",
      "Upload fake properties",
      "Submit forged documents",
      "Abuse other users",
      "Engage in illegal activities",
    ],
  },
  {
    id: "s18",
    num: "Section 18",
    title: "",
    emphasis: "Disclaimer",
    intro: "APT provides a platform that connects tenants and rental owners. APT does not guarantee:",
    list: [
      "Property availability",
      "Property quality",
      "Successful rental transactions",
      "Accuracy of all user-submitted information",
      "Continuous Platform availability",
    ],
    callout: {
      kind: "info",
      label: "Disclaimer",
      text: "Users are encouraged to inspect properties personally before entering into rental agreements.",
    },
  },
  {
    id: "s19",
    num: "Section 19",
    title: "Limitation of",
    emphasis: "Liability",
    intro: "APT shall not be liable for:",
    list: [
      "Disputes between tenants and rental owners",
      "Property damages",
      "Rental agreement violations",
      "Lost profits",
      "Delayed payments",
      "Third-party payment gateway failures",
      "Service interruptions beyond reasonable control",
    ],
  },
  {
    id: "s20",
    num: "Section 20",
    title: "Governing",
    emphasis: "Law",
    body: [
      "These Terms shall be governed by the laws of the Republic of the Philippines. Any legal dispute arising from the use of APT shall be subject to the jurisdiction of the appropriate Philippine courts.",
    ],
  },
  {
    id: "s21",
    num: "Section 21",
    title: "Changes to These",
    emphasis: "Terms",
    body: [
      "APT reserves the right to update or modify these Terms and Conditions when necessary to reflect changes in platform features, policies, or applicable laws.",
      "Users will be informed of significant changes through appropriate communication methods, such as platform notifications, email, or announcements on the website or mobile application.",
      "The updated Terms and Conditions will indicate their effective date. Continued use of the platform after the effective date may constitute acceptance of the revised Terms, subject to applicable laws.",
    ],
  },
  {
    id: "s22",
    num: "Section 22",
    title: "Compliance with Philippine",
    emphasis: "Rental Laws",
    body: [
      "APT is designed to facilitate rental transactions but does not replace applicable Philippine laws governing residential leases. Users agree to comply with all applicable laws, including Republic Act No. 9653 (Rent Control Act of 2009), its implementing rules, subsequent amendments or extensions, and other applicable laws governing residential leasing. Any lease agreement entered into through the Platform shall remain subject to these applicable laws.",
    ],
  },
];
