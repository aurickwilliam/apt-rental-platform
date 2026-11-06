import type { LegalPolicy } from "./types";
import { LEGAL_CONTACT } from "./types";

// Mirror apps/web/app/(main)/pap/data/pap-sections.ts without a web runtime dependency.
export const PRIVACY_POLICY: LegalPolicy = {
  title: "Privacy Policy",
  lastUpdated: "November 7, 2026",
  version: "1.2",
  jurisdiction: "Effective in the Philippines",
  contact: LEGAL_CONTACT,
  sections: [
    {
      id: "p1", title: "Introduction",
      blocks: [
        { type: "paragraph", text: 'APT (A Place to Thrive) is a rental management platform for tenants and landlords, focused on Caloocan, Malabon, Navotas and Valenzuela in the Philippines. This Privacy Policy explains how personal information is handled when you use the APT website and mobile application ("Platform"), including browsing, registration, verification and rental management.' },
        { type: "paragraph", text: "The information processed depends on the features you use and whether you act as a tenant, landlord or administrator. This notice explains processing; it does not make continued browsing a blanket consent to every use of personal information. Where consent is required, it must relate to the particular processing involved." },
      ],
    },
    {
      id: "p2", title: "Information We Collect",
      blocks: [
        { type: "paragraph", text: "You provide information through forms, uploads and interactions. APT also creates records of rental activity and receives technical information needed to run the Platform. Required fields are identified in the relevant flow; optional information is collected when you choose to provide it." },
        { type: "subheading", text: "A. Accounts and verification" },
        { type: "list", items: [
          "Registration and profile details: name, email, mobile number, birth date, gender, residential address and account role. Profile and background photos are optional. Google sign-in supplies account identity information such as your email, name and profile photo.",
          "Account and security records: authentication identifiers, verification and suspension status, sign-in and code-verification attempts, and the policy versions, time and registration journey associated with your explicit acceptance.",
          "Identity verification and APT Passport: government ID images, including a back image where applicable, selfie captures, supporting documents such as proof of income, proof of billing or NBI clearance, and landlord ownership documents. Documents may contain identification numbers, financial information and other sensitive personal information. APT records document type, expiry, review status and review feedback.",
        ] },
        { type: "subheading", text: "B. Preferences, applications and tenancies" },
        { type: "list", items: [
          "Saved rental preferences, favorites and search choices, including cities, budget, rooms, pet and parking needs, smoking and household-disability answers. Disability-related answers can reveal sensitive health information; avoid unnecessary details about another household member.",
          "Visit requests and schedules, application answers and attached document references, employment or income details requested by the application, proposed move-in dates, application decisions and rental history. An application stores the answers you submit, including pet, parking, smoking and household-disability details, separately from later preference edits.",
          "Tenancy terms, rent and billing periods, deposits and advance amounts, lease documents and the time of a tenant's acknowledgement of an uploaded signed lease. Maintenance records include descriptions, photos, resolution notes and any fees or waivers.",
        ] },
        { type: "subheading", text: "C. Listings, payments and landlord records" },
        { type: "list", items: [
          "Property names, addresses and map pins, photos, descriptions, amenities, prices, rental rules, availability and listing-verification documents and decisions.",
          "Payment methods used, references, provider checkout and transaction identifiers, amounts, billing allocations, dates, receipts and payment status. Landlords may also record expenses, budgets, reserves and expense-review confirmations for their properties.",
        ] },
        { type: "subheading", text: "D. Communications and safety" },
        { type: "list", items: [
          "Messages and attachments, including images, videos, GIFs and documents; reactions, read status and conversation preferences; apartment and tenant ratings, comments and review photos; reports, report reasons and moderation outcomes.",
          "Ava search conversation text, notification preferences, notification delivery and read records, and device push tokens where push notifications are enabled. APT also records account-level usage counts for Ava's daily allowance.",
        ] },
        { type: "subheading", text: "E. Device and location information" },
        { type: "paragraph", text: "APT and its infrastructure providers may process IP addresses, request times, browser or device information, app versions and technical error or security logs. Location-enabled features may use your device location when you grant permission. Property addresses, search areas and pins are also location information, whether entered manually or chosen on a map." },
      ],
      callout: { kind: "info", label: "Required and optional information", text: "Browsing does not require uploading an ID. Verification and particular rental actions require additional information or documents. Declining an optional permission does not itself accept a policy, but the feature that needs that permission may be unavailable." },
    },
    {
      id: "p3", title: "How We Use Your Information",
      blocks: [
        { type: "paragraph", text: "APT uses information for the following purposes:" },
        { type: "list", items: [
          "Create and maintain accounts, authenticate users, recover access, review identity and supporting documents, and enforce account and portal access rules.",
          "Display listings and profiles, remember preferences, rank rental recommendations, support map searches and provide Ava's optional search assistance.",
          "Send applications and their attached documents to the relevant landlord, arrange visits, record decisions, manage tenancies and signed leases, calculate bills and record payments and maintenance.",
          "Provide messaging, reviews, reports, in-app notifications, push delivery and transactional emails, including security and moderation notices and updates about rent and payments, verification, rental applications and maintenance requests.",
          "Provide landlord financial summaries and planning tools, investigate reported misuse, limit repeated authentication attempts, resolve disputes and meet applicable legal obligations.",
        ] },
        { type: "paragraph", text: "Depending on the information and purpose, processing may be necessary to take steps you request before a contract or to perform a contract, comply with law, or pursue a legitimate interest permitted by law, such as securing the Platform. Where consent is the applicable basis, APT must obtain it for the relevant purpose. Sensitive personal information, including information in IDs or disability-related answers, requires an applicable condition under Philippine law; a general legitimate-interest statement is not a substitute for that condition." },
        { type: "paragraph", text: "Search rankings and Ava help you find listings; they do not approve applications, verify identities or guarantee eligibility. Application and verification decisions remain separate from search suggestions." },
      ],
    },
    {
      id: "p4", title: "Sharing of Information",
      blocks: [
        { type: "paragraph", text: "APT does not sell personal information. Visibility depends on the type of record and your relationship to it:" },
        { type: "list", items: [
          "Public information: visible listings include property addresses, map pins and photos. Landlord profiles can display names, profile/background photos, account or verification indicators, listings and ratings. Apartment reviews can display the reviewer's name, photo, rating, comment and review photos. Public images may be copied or cached by others.",
          "Contact and tenant profiles: landlord contact details are available to signed-in viewers through the profile features, not to signed-out visitors. Tenant profiles and rental history are restricted to eligible viewers, including landlords with an application or tenancy relationship. Tenant ratings have their own relationship-based access rules and are not a public directory.",
          "Applications: submitting an application automatically attaches eligible Passport documents by reference. The relevant landlord can access the submitted information and documents, including the attached ID front/back where applicable, but not your verification selfie through the application. Editing saved preferences does not rewrite an earlier application's answers.",
          "Passport indicators: a public ownership-verification badge or ownership-document type/status does not publish the document file. The wallet is shared between your own tenant and landlord portals; supporting-document visibility and application access remain restricted.",
          "Rental records: messages and attachments are shared with conversation participants; tenancy, payment and maintenance records are accessible to the relevant parties under access rules. Signed leases are restricted to the tenancy's landlord and tenant, not administrators. Private landlord expense and budget records are owner-restricted, not available merely because someone is an administrator.",
          "Administration: authorized administrators review verification submissions, reports and other records available to their role for safety and moderation. Administrative status does not grant unrestricted access to every private record. Reporters receive a generic review notice rather than another person's confidential enforcement details.",
        ] },
        { type: "paragraph", text: "Necessary information is also processed by providers described below. Information may be disclosed where required by law or a lawful authority, or as otherwise permitted by applicable law for handling disputes or protecting legal rights. A landlord or another recipient may retain copies you have shared; removing information from APT does not automatically remove those copies." },
      ],
    },
    {
      id: "p5", title: "Data Security",
      blocks: [
        { type: "paragraph", text: "APT uses authentication, encrypted network connections (HTTPS), database and storage access rules, and time-limited links for private files. Password authentication is handled by Supabase Auth using password hashing, not reversible password encryption. Administrative access uses an additional verification step where enforced." },
        { type: "paragraph", text: "Messages are access-controlled but are not represented as end-to-end encrypted. Public listing, profile and review images are not private files. No online system can guarantee complete security, and an authorized recipient may download or share information they can view. Do not share passwords, one-time codes or payment credentials in messages or uploads." },
      ],
    },
    {
      id: "p6", title: "User Responsibilities",
      blocks: [
        { type: "list", items: [
          "Keep account credentials confidential, secure shared devices and report suspected unauthorized access through an available APT support channel.",
          "Provide accurate information and upload only documents and photos you are entitled to share. Avoid including unrelated identification, financial, health or household information.",
          "If you provide information about another person, make sure you have a lawful basis to do so and that they understand how it will be used. Do not upload another person's private documents merely because you have a copy.",
          "Landlords and other recipients must handle applicants' and tenants' information lawfully, use it for the relevant rental purpose, and protect downloaded copies. Access through APT is not permission to publish or reuse private documents for unrelated purposes.",
        ] },
      ],
    },
    {
      id: "p7", title: "Data Retention",
      blocks: [
        { type: "paragraph", text: "Retention depends on the record's purpose, whether an account or tenancy remains active, unresolved applications, payments or disputes, security needs and applicable legal obligations. This notice does not promise a single fixed retention period for all records." },
        { type: "paragraph", text: "Signing out, clearing device storage, hiding or deleting a listing, or replacing a document does not necessarily erase related server records or uploaded files. Some removal actions hide a record rather than permanently destroy it. Application references, rental history, payment records, moderation records, policy acceptance history and copies held in backups or by recipients may remain where necessary and lawful. Automatic deletion of every chat attachment or maintenance photo is not currently provided." },
        { type: "paragraph", text: "An erasure request must be assessed against applicable legal grounds and outstanding obligations. APT should explain any lawful reason for retaining requested information; neither account closure nor a request guarantees immediate removal of all linked records or recipient copies." },
      ],
    },
    {
      id: "p8", title: "Cookies and Similar Technologies",
      blocks: [
        { type: "paragraph", text: "The website uses session cookies and browser storage for authentication and local preferences. The mobile app uses device storage for its session and preferences. Examples include theme and portal choice, notification display settings, recent apartment searches and dismissed update or review prompts. Some preferences are device-only; saved account preferences are stored on the server." },
        { type: "paragraph", text: "You can clear browser or app storage and change available settings. Doing so can sign you out or reset preferences without deleting your server account or rental records. Blocking necessary cookies or storage can prevent sign-in and other features from working. This notice does not claim that APT uses advertising trackers or a general behavioral-analytics service." },
        { type: "paragraph", text: "Camera, photo/file access, location and notification permissions support the features you choose, such as capturing an ID, attaching photos, locating a property or receiving alerts. Saving a receipt to Photos uses the relevant device capability. Available permissions and controls vary by device; you can review them in system settings. A granted permission does not mean APT uploads your entire photo library." },
      ],
    },
    {
      id: "p9", title: "Third-Party Services",
      blocks: [
        { type: "paragraph", text: "Providers receive information needed for the features they operate. Their own terms and privacy notices also apply to processing they control. Services may process information outside the Philippines; applicable privacy requirements continue to apply to APT's use and disclosure of that information." },
        { type: "list", items: [
          "Supabase provides authentication, database, file storage and realtime infrastructure. Hosting and app-update infrastructure also process network requests and technical information needed to deliver the website and app updates.",
          "Google supports optional Google sign-in and maps/address services. Map use can send search text, selected locations, device/network information and location information used by that feature to Google.",
          "Ava uses Google Gemini when the AI service is configured and available. A limited recent conversation is sent for a reply and search filters; APT does not automatically include your profile, Passport files or rental records. Anything you type into that conversation can still be disclosed to Google. Under the free-tier service terms, prompts may be used to improve Google's products. APT records usage counts for limits but does not log Ava message text in its search function. Keyword fallback search is used when AI is unavailable or the allowance is reached.",
          "PayMongo hosts online checkout. Card numbers, wallet credentials and online-banking credentials are entered on the provider's page, not in APT. The current online-payment integration uses test mode or a configured simulation; it does not transfer real funds or disburse payouts to landlords. Cash payments are records awaiting landlord confirmation.",
          "Expo's push service and the relevant device push infrastructure deliver notifications using a device token and notification content. Email delivery services, including Brevo for configured moderation and account activity emails, process recipient addresses and message content, such as rent and payment amounts, apartment names, a tenant's name, verification results and rejection reasons, and maintenance request titles. Notifications can reveal names or message/event previews on a lock screen or in an inbox; control previews and push permissions in your device settings. Your notification settings for payments, maintenance, apartments and system updates also turn off the matching activity emails. Sign-in codes and security, moderation and lease renewal emails are still sent.",
          "Where configured, Cloudflare Turnstile performs anti-abuse checks for protected authentication requests and processes browser/device and network signals. This protection is not necessarily enabled in every installation or environment.",
        ] },
      ],
      callout: { kind: "warning", label: "Use Ava for rental searches only", text: "Do not enter ID numbers, passwords, one-time codes, payment credentials, private documents or sensitive information about yourself or another person into Ava. You can use ordinary search without sending an Ava conversation to Gemini." },
    },
    {
      id: "p10", title: "User Rights",
      blocks: [
        { type: "paragraph", text: "Subject to Philippine law and applicable exceptions, you have rights concerning your personal information, including:" },
        { type: "list", items: [
          "Be informed about processing and request access to your personal information.",
          "Dispute inaccuracies and request correction; available profile fields and preferences can also be updated in the Platform.",
          "Object to processing or withdraw consent where consent is the applicable basis. Withdrawal does not make earlier lawful processing unlawful, and a feature may no longer be available if it needs that processing.",
          "Request blocking, removal or destruction where legally justified, and data portability where applicable. These rights do not automatically override lawful retention requirements or another person's rights.",
          "Seek appropriate remedies or damages and lodge a complaint with the Philippine National Privacy Commission (privacy.gov.ph).",
        ] },
        { type: "paragraph", text: "Raise a privacy request through an available APT support channel, describing the information and action involved without sending unnecessary sensitive documents. Identity and authority may need to be verified before access or changes are provided. Account deletion and data export are not promised as immediate self-service features by this notice." },
      ],
    },
    {
      id: "p11", title: "Children's Privacy",
      blocks: [
        { type: "paragraph", text: "APT account registration is intended for people aged eighteen (18) or older who can enter into rental arrangements. Birth dates are used to check registration eligibility. Do not create an account for a minor or upload a minor's identity documents for that purpose." },
        { type: "paragraph", text: "Rental applications may include household information. Provide only what is requested and necessary, and avoid including a child's name, medical details, photograph or identification in free-text answers or attachments. If you believe a minor's information has been submitted improperly, raise the concern through an available APT support channel." },
      ],
      callout: { kind: "warning", label: "Adult accounts only", text: "APT does not invite minors to register. A household answer is not a request for a child's identity documents or detailed health records." },
    },
    {
      id: "p12", title: "Compliance with Philippine Laws",
      blocks: [
        { type: "paragraph", text: "APT's processing is subject to the Data Privacy Act of 2012 (Republic Act No. 10173), its Implementing Rules and Regulations and applicable National Privacy Commission issuances. Processing should follow transparency, legitimate purpose and proportionality, with an appropriate legal basis and safeguards for personal and sensitive personal information." },
        { type: "paragraph", text: "This policy describes the Platform and does not certify regulatory approval, replace a landlord's own privacy obligations or waive a data subject's statutory rights. APT's use of a service provider does not remove its responsibilities under applicable law." },
      ],
    },
    {
      id: "p13", title: "Changes to this Privacy Policy",
      blocks: [
        { type: "paragraph", text: "APT may revise this notice when features, processing practices or legal requirements change. The version and Last Updated date identify the published notice. Where a change requires notice or fresh consent under applicable law, that requirement is separate from merely continuing to browse." },
        { type: "paragraph", text: "Registration records the particular policy revision explicitly accepted at that time. Publishing a new revision does not rewrite earlier acceptance records or automatically require every existing account to register again. An unfinished registration using an outdated revision must review and accept the current revision before completion." },
      ],
    },
  ],
};
