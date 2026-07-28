// apps/web/app/(main)/pap/data/pap-sections.ts

export const BRAND = {
  email: "support@apt-rental.ph",
  address: "109 Samson Road corner Caimito Road, Caloocan, Philippines",
  hours: "Monday–Friday, 9:00 AM – 6:00 PM (PHT)",
};

export type Callout = { kind: "info" | "warning"; label: string; text: string };

export type Block =
  | { type: "paragraph"; text: string }
  | { type: "subheading"; text: string }
  | { type: "list"; items: string[] };

export type Section = {
  id: string;
  num: string;
  title: string;
  emphasis: string; // the primary-colored word(s) at the end of the title
  blocks: Block[];
  callout?: Callout;
};

export const TOC: { id: string; label: string }[] = [
  { id: "p1", label: "1. Introduction" },
  { id: "p2", label: "2. Information We Collect" },
  { id: "p3", label: "3. How We Use Your Information" },
  { id: "p4", label: "4. Sharing of Information" },
  { id: "p5", label: "5. Data Security" },
  { id: "p6", label: "6. User Responsibilities" },
  { id: "p7", label: "7. Data Retention" },
  { id: "p8", label: "8. Cookies & Similar Technologies" },
  { id: "p9", label: "9. Third-Party Services" },
  { id: "p10", label: "10. User Rights" },
  { id: "p11", label: "11. Children's Privacy" },
  { id: "p12", label: "12. Compliance with PH Laws" },
  { id: "p13", label: "13. Changes to this Policy" },
];

export const SECTIONS: Section[] = [
  {
    id: "p1",
    num: "Section 01",
    title: "",
    emphasis: "Introduction",
    blocks: [
      {
        type: "paragraph",
        text: `APT (A Place to Thrive) is committed to protecting the privacy and personal information of its users. This Privacy Policy explains how we collect, use, store, disclose, and protect your personal information when you use the APT website and mobile application ("Platform").`,
      },
      {
        type: "paragraph",
        text: "By accessing or using APT, you acknowledge that you have read and understood this Privacy Policy and consent to the collection and processing of your personal information as described herein.",
      },
    ],
  },
  {
    id: "p2",
    num: "Section 02",
    title: "Information We",
    emphasis: "Collect",
    blocks: [
      { type: "paragraph", text: "To provide our services efficiently, APT may collect the following information." },
      { type: "subheading", text: "A. Personal Information" },
      { type: "paragraph", text: "During account registration and verification, we may collect:" },
      {
        type: "list",
        items: [
          "Full name",
          "Email address",
          "Mobile number",
          "Date of birth (if required)",
          "Residential address",
          "Government-issued identification",
          "Selfie photograph for identity verification",
          "Profile picture",
        ],
      },
      { type: "subheading", text: "B. Rental Information" },
      { type: "paragraph", text: "To facilitate apartment rentals, we may collect:" },
      {
        type: "list",
        items: [
          "Rental applications",
          "Preferred move-in dates",
          "Lease information",
          "Rental history within the Platform",
          "Property viewing schedules",
          "Uploaded supporting documents",
        ],
      },
      { type: "subheading", text: "C. Property Information (Rental Owners)" },
      { type: "paragraph", text: "Rental owners may provide:" },
      {
        type: "list",
        items: [
          "Property name",
          "Property address",
          "Rental price",
          "Property description",
          "Amenities",
          "Availability status",
          "Property photographs",
          "Rental policies",
        ],
      },
      { type: "subheading", text: "D. Payment Information" },
      { type: "paragraph", text: "When processing rental payments, the Platform may collect:" },
      {
        type: "list",
        items: ["Payment reference numbers", "Transaction dates", "Payment amounts", "Payment status"],
      },
      { type: "subheading", text: "E. Communication Information" },
      { type: "paragraph", text: "When using the messaging feature, we may collect:" },
      { type: "list", items: ["Chat messages"] },
      { type: "subheading", text: "F. Device Information" },
      { type: "paragraph", text: "To improve platform performance, we may automatically collect:" },
      {
        type: "list",
        items: [
          "Device type",
          "Operating system",
          "Browser information",
          "IP address",
          "Date and time of access",
          "Log information",
        ],
      },
    ],
    callout: {
      kind: "info",
      label: "Please note",
      text: "APT does not intentionally store complete bank account information. Online payments are processed through authorized third-party payment providers.",
    },
  },
  {
    id: "p3",
    num: "Section 03",
    title: "How We Use Your",
    emphasis: "Information",
    blocks: [
      { type: "paragraph", text: "APT uses collected information to:" },
      {
        type: "list",
        items: [
          "Create and manage user accounts",
          "Verify user identity",
          "Match tenants with rental owners",
          "Process rental applications",
          "Schedule property visits",
          "Facilitate communication between tenants and rental owners",
          "Process rental payments",
          "Track payment history",
          "Manage maintenance requests",
          "Improve platform functionality",
          "Detect fraud and unauthorized activities",
          "Comply with legal obligations",
        ],
      },
    ],
  },
  {
    id: "p4",
    num: "Section 04",
    title: "Sharing of",
    emphasis: "Information",
    blocks: [
      {
        type: "paragraph",
        text: "APT does not sell users' personal information. Information may only be shared under the following circumstances:",
      },
      { type: "subheading", text: "Between Users:" },
      {
        type: "paragraph",
        text: "Limited information may be shared between tenants and rental owners when necessary to complete rental transactions.",
      },
      { type: "subheading", text: "Service Providers:" },
      { type: "paragraph", text: "APT may share necessary information with trusted third-party providers responsible for:" },
      {
        type: "list",
        items: ["Payment processing", "Cloud database services", "Authentication services", "File storage", "Email notifications"],
      },
      { type: "paragraph", text: "These providers are required to protect your information." },
      { type: "subheading", text: "Legal Requirements:" },
      {
        type: "paragraph",
        text: "Information may also be disclosed when required by law, court order, or lawful government request.",
      },
    ],
  },
  {
    id: "p5",
    num: "Section 05",
    title: "Data",
    emphasis: "Security",
    blocks: [
      {
        type: "paragraph",
        text: "APT implements reasonable administrative, technical, and organizational safeguards to protect user information against unauthorized access, disclosure, alteration, and destruction. These measures may include:",
      },
      {
        type: "list",
        items: [
          "Secure authentication",
          "Encrypted communication (HTTPS)",
          "Password encryption",
          "Access controls",
          "Database security",
          "Regular security monitoring",
        ],
      },
    ],
  },
  {
    id: "p6",
    num: "Section 06",
    title: "User",
    emphasis: "Responsibilities",
    blocks: [
      { type: "paragraph", text: "Users are responsible for:" },
      {
        type: "list",
        items: [
          "Keeping passwords confidential",
          "Providing accurate information",
          "Updating account information when necessary",
          "Reporting unauthorized account access immediately",
        ],
      },
      {
        type: "paragraph",
        text: "Users are also responsible for ensuring that uploaded documents are authentic and legally owned.",
      },
    ],
  },
  {
    id: "p7",
    num: "Section 07",
    title: "Data",
    emphasis: "Retention",
    blocks: [
      { type: "paragraph", text: "APT retains personal information only for as long as necessary to:" },
      {
        type: "list",
        items: ["Maintain user accounts", "Process rental transactions", "Comply with legal obligations", "Improve system performance"],
      },
    ],
  },
  {
    id: "p8",
    num: "Section 08",
    title: "Cookies and Similar",
    emphasis: "Technologies",
    blocks: [
      { type: "paragraph", text: "The website version of APT may use cookies and similar technologies to:" },
      {
        type: "list",
        items: ["Maintain login sessions", "Improve website performance", "Remember user preferences", "Analyze platform usage"],
      },
      {
        type: "paragraph",
        text: "Users may configure their browsers to refuse cookies; however, some features of the Platform may not function properly.",
      },
    ],
  },
  {
    id: "p9",
    num: "Section 09",
    title: "Third-Party",
    emphasis: "Services",
    blocks: [
      {
        type: "paragraph",
        text: "APT may utilize trusted third-party services for certain platform functions, including cloud database management, authentication, file storage, and payment processing.",
      },
      {
        type: "paragraph",
        text: "Users acknowledge that these third-party providers may have their own privacy policies governing the processing of information handled through their services.",
      },
    ],
  },
  {
    id: "p10",
    num: "Section 10",
    title: "User",
    emphasis: "Rights",
    blocks: [
      { type: "paragraph", text: "Subject to applicable laws, users may request to:" },
      {
        type: "list",
        items: [
          "Access their personal information",
          "Correct inaccurate information",
          "Update account information",
          "Delete their account, subject to legal and contractual obligations",
          "Withdraw consent where applicable",
        ],
      },
      { type: "paragraph", text: "Requests may be submitted through the APT support team." },
    ],
  },
  {
    id: "p11",
    num: "Section 11",
    title: "Children's",
    emphasis: "Privacy",
    blocks: [
      {
        type: "paragraph",
        text: "APT is intended for individuals who are at least eighteen (18) years old and legally capable of entering into rental agreements.",
      },
    ],
    callout: {
      kind: "warning",
      label: "Important",
      text: "The Platform does not knowingly collect personal information from minors.",
    },
  },
  {
    id: "p12",
    num: "Section 12",
    title: "Compliance with Philippine",
    emphasis: "Laws",
    blocks: [
      {
        type: "paragraph",
        text: "APT processes personal information in accordance with the applicable laws of the Republic of the Philippines, including the Data Privacy Act of 2012 (Republic Act No. 10173), its Implementing Rules and Regulations, and other relevant issuances of the National Privacy Commission.",
      },
    ],
  },
  {
    id: "p13",
    num: "Section 13",
    title: "Changes to this Privacy",
    emphasis: "Policy",
    blocks: [
      {
        type: "paragraph",
        text: "APT may revise this Privacy Policy from time to time to reflect improvements in the Platform, changes in applicable laws, or operational requirements.",
      },
    ],
  },
];