import type { LegalPolicy } from "./types";
import { LEGAL_CONTACT } from "./types";

// Mirror apps/web/app/(main)/tos/data/tos-sections.ts without a web runtime dependency.
export const TERMS_POLICY: LegalPolicy = {
  title: "Terms and Conditions",
  lastUpdated: "October 29, 2026",
  version: "1.1",
  jurisdiction: "Effective in the Philippines",
  contact: LEGAL_CONTACT,
  sections: [
    {
      id: "s1", title: "Acceptance of Terms",
      body: [
        'Welcome to APT (A Place to Thrive). These Terms and Conditions ("Terms") govern your access to and use of the APT website and mobile application ("Platform"). By creating an account, accessing, or using the Platform, you acknowledge that you have read, understood, and agree to comply with these Terms.',
      ],
      callout: { kind: "info", label: "Note", text: "If you do not agree with these Terms, you must discontinue use of the Platform immediately." },
    },
    {
      id: "s2", title: "About APT",
      intro: "The Platform allows users to:",
      list: [
        "Search apartments", "List rental properties", "Submit rental applications", "Book property visits",
        "Communicate through in-app messaging", "Track rental payments", "Submit maintenance requests", "Review and rate properties",
      ],
      body: ["APT serves only as an intermediary platform and is not a property owner, real estate broker, or property management company."],
    },
    {
      id: "s3", title: "Eligibility",
      intro: "To use APT, users must meet the following requirements:",
      list: [
        "Be at least eighteen (18) years old.",
        "Provide accurate, complete, and truthful personal information.",
        "Complete the required identity verification process.",
        "Have the legal capacity to enter into rental agreements.",
        "Comply with applicable Philippine laws and platform policies.",
      ],
      body: ["Users who provide false information or fraudulent documents may have their accounts suspended or permanently terminated."],
    },
    {
      id: "s4", title: "User Accounts",
      intro: "Users are responsible for:",
      list: ["Maintaining the confidentiality of their account credentials", "Ensuring that all information remains accurate", "Immediately reporting unauthorized account access"],
      callout: { kind: "info", label: "Note", text: "APT reserves the right to suspend accounts involved in fraudulent or suspicious activities." },
    },
    {
      id: "s5", title: "Identity Verification",
      intro: "To improve trust and reduce rental scams, APT requires identity verification. Verification may include:",
      list: ["Government-issued Philippine ID", "Selfie verification", "Additional verification documents when necessary"],
      callout: { kind: "info", label: "Important", text: "Providing forged or altered documents will result in immediate account suspension." },
    },
    {
      id: "s6", title: "Services for Tenants",
      intro: "Tenants may use the Platform to:",
      list: [
        "Browse available apartments", "Filter apartments by location, price, amenities, and other preferences",
        "View property information", "Schedule property visits", "Submit rental applications", "Upload required documents",
        "Pay rent through supported payment methods", "Communicate with rental owners", "Submit maintenance requests", "Leave reviews after occupying a property",
      ],
    },
    {
      id: "s7", title: "Services for Rental Owners",
      intro: "Rental owners may use the Platform to:",
      list: [
        "Create verified property listings", "Upload property photos and descriptions", "Receive rental applications",
        "Review submitted documents", "Accept or reject applicants", "Track rental payments", "Respond to maintenance requests",
        "Communicate with tenants", "View rental performance and analytics",
      ],
      body: ["Rental owners are solely responsible for ensuring that all listings are accurate, lawful, and up to date."],
    },
    {
      id: "s8", title: "Property Listings",
      intro: "Rental owners agree that every listing must:",
      list: ["Represent a real property", "Contain truthful descriptions", "Display accurate rental prices", "Include genuine photographs", "Clearly disclose rental rules and policies"],
      body: ["APT may remove listings that are false, misleading, fraudulent, duplicated, or already unavailable."],
    },
    {
      id: "s9", title: "Rental Applications",
      intro: "Rental owners have the sole discretion to:",
      list: ["Review applications", "Request additional information", "Accept or reject applicants"],
      body: ["Submitting a rental application does not guarantee acceptance."],
      callout: { kind: "info", label: "Please note", text: "APT is not responsible for decisions made by rental owners." },
    },
    {
      id: "s10", title: "Rental Agreements",
      body: [
        "Rental agreements made through APT are solely between the tenant and the rental owner.",
        "APT's Terms and Conditions govern the use of the platform and are separate from the rental agreement established between the tenant and rental owner.",
        "Both parties are responsible for understanding and following the terms of their rental agreement, including rental duration, monthly payments, security deposits, and other agreed conditions.",
        "APT serves as a platform for facilitating rental transactions and is not a party to the rental agreement. Disputes regarding rental agreements shall be resolved between the parties involved, subject to applicable laws.",
      ],
    },
    {
      id: "s11", title: "Payments",
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
      id: "s12", title: "Maintenance Requests",
      body: ["Tenants may submit maintenance requests through the Platform. Rental owners remain solely responsible for:"],
      list: ["Evaluating requests", "Scheduling repairs", "Completing maintenance work"],
      callout: { kind: "info", label: "Please note", text: "APT only provides the communication platform — it does not perform or guarantee maintenance work." },
    },
    {
      id: "s13", title: "Reviews and Ratings",
      intro: "Only tenants with actual rental experience may submit reviews. Users agree that reviews must:",
      list: ["Be truthful", "Be respectful", "Not contain offensive language", "Not contain false accusations"],
      body: ["APT reserves the right to remove reviews that violate these Terms."],
    },
    {
      id: "s14", title: "Prohibited Activities",
      intro: "Users must not:",
      list: [
        "Create fake accounts", "Upload forged identification", "Post fraudulent listings", "Harass other users",
        "Upload malicious software", "Attempt unauthorized access", "Use automated bots without authorization",
        "Interfere with the Platform's operations", "Violate Philippine laws",
      ],
      callout: { kind: "warning", label: "Warning", text: "Violation may result in suspension or permanent account termination." },
    },
    {
      id: "s15", title: "Intellectual Property",
      body: [
        "All software, graphics, logos, interface, and content created by APT remain the intellectual property of the developers unless otherwise stated.",
        "Users retain ownership of the content they upload but grant APT permission to display such content for Platform operations.",
      ],
    },
    {
      id: "s16", title: "Privacy and Data Protection",
      intro: "APT collects and processes personal information necessary for the operation of the platform, including:",
      list: [
        "Account registration and management.", "Identity verification.", "Rental applications and document submissions.",
        "Payment processing and monitoring.", "Communication between tenants and rental owners.", "Platform security and fraud prevention.",
      ],
      body: [
        "Personal information and uploaded documents shall be handled in accordance with the APT Privacy Policy and applicable Philippine data protection laws.",
        "Users are encouraged to review the Privacy Policy to understand how their personal information is collected, used, stored, shared, and protected.",
      ],
    },
    {
      id: "s17", title: "Suspension and Termination",
      intro: "APT reserves the right to suspend or terminate accounts that:",
      list: ["Violate these Terms", "Commit fraud", "Upload fake properties", "Submit forged documents", "Abuse other users", "Engage in illegal activities"],
    },
    {
      id: "s18", title: "Disclaimer",
      intro: "APT provides a platform that connects tenants and rental owners. APT does not guarantee:",
      list: ["Property availability", "Property quality", "Successful rental transactions", "Accuracy of all user-submitted information", "Continuous Platform availability"],
      callout: { kind: "info", label: "Disclaimer", text: "Users are encouraged to inspect properties personally before entering into rental agreements." },
    },
    {
      id: "s19", title: "Limitation of Liability",
      intro: "APT shall not be liable for:",
      list: ["Disputes between tenants and rental owners", "Property damages", "Rental agreement violations", "Lost profits", "Delayed payments", "Third-party payment gateway failures", "Service interruptions beyond reasonable control"],
    },
    {
      id: "s20", title: "Governing Law",
      body: ["These Terms shall be governed by the laws of the Republic of the Philippines. Any legal dispute arising from the use of APT shall be subject to the jurisdiction of the appropriate Philippine courts."],
    },
    {
      id: "s21", title: "Changes to These Terms",
      body: [
        "APT reserves the right to update or modify these Terms and Conditions when necessary to reflect changes in platform features, policies, or applicable laws.",
        "Users will be informed of significant changes through appropriate communication methods, such as platform notifications, email, or announcements on the website or mobile application.",
        "The updated Terms and Conditions will indicate their effective date. Continued use of the platform after the effective date may constitute acceptance of the revised Terms, subject to applicable laws.",
      ],
    },
    {
      id: "s22", title: "Compliance with Philippine Rental Laws",
      body: ["APT is designed to facilitate rental transactions but does not replace applicable Philippine laws governing residential leases. Users agree to comply with all applicable laws, including Republic Act No. 9653 (Rent Control Act of 2009), its implementing rules, subsequent amendments or extensions, and other applicable laws governing residential leasing. Any lease agreement entered into through the Platform shall remain subject to these applicable laws."],
    },
  ],
};
