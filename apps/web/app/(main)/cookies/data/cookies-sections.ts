export const BRAND = {
  email: "support@apt-rental.ph",
  address: "109 Samson Road corner Caimito Road, Caloocan, Philippines",
  hours: "Monday–Friday, 9:00 AM – 6:00 PM (PHT)",
};

export type Callout = { kind: "info" | "warning"; label: string; text: string };

// Same block-based shape as pap-sections.ts, since "Types of Cookies We Use"
// has the same kind of lettered subsections (A-D) as PAP's Section 2.
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
  { id: "c1", label: "1. Introduction" },
  { id: "c2", label: "2. What Are Cookies?" },
  { id: "c3", label: "3. Types of Cookies We Use" },
  { id: "c4", label: "4. How We Use Cookies" },
  { id: "c5", label: "5. Third-Party Services" },
  { id: "c6", label: "6. Managing Cookies" },
  { id: "c7", label: "7. Data Collected Through Cookies" },
  { id: "c8", label: "8. Cookie Retention" },
  { id: "c9", label: "9. Changes to This Policy" },
];

export const SECTIONS: Section[] = [
  {
    id: "c1",
    num: "Section 01",
    title: "",
    emphasis: "Introduction",
    blocks: [
      {
        type: "paragraph",
        text: "This Cookie Policy explains how APT (A Place to Thrive) uses cookies and similar technologies when you visit and use our website. This Policy should be read together with our Privacy Policy and Terms of Service.",
      },
      {
        type: "paragraph",
        text: "By continuing to use our website, you consent to the use of cookies as described in this Policy.",
      },
    ],
  },
  {
    id: "c2",
    num: "Section 02",
    title: "What Are",
    emphasis: "Cookies?",
    blocks: [
      {
        type: "paragraph",
        text: "Cookies are small text files stored on your device by your web browser when you visit a website. They help websites remember your preferences, improve functionality, enhance security, and provide a better browsing experience.",
      },
      {
        type: "paragraph",
        text: "Our mobile application generally does not use browser cookies but may use similar technologies, such as secure local storage, to support application functionality.",
      },
    ],
  },
  {
    id: "c3",
    num: "Section 03",
    title: "Types of Cookies We",
    emphasis: "Use",
    blocks: [
      { type: "paragraph", text: "APT uses the following types of cookies on our website:" },
      { type: "subheading", text: "A. Essential Cookies" },
      {
        type: "paragraph",
        text: "These cookies are necessary for the operation of the APT website and cannot be disabled without affecting core functions. Examples include:",
      },
      {
        type: "list",
        items: ["User authentication", "Login session management", "Security verification", "Navigation between pages"],
      },
      { type: "subheading", text: "B. Functional Cookies" },
      { type: "paragraph", text: "These cookies remember your preferences to improve your experience. Examples include:" },
      {
        type: "list",
        items: ["Language preferences", "Saved login sessions (where applicable)", "User interface preferences"],
      },
      { type: "subheading", text: "C. Performance and Analytics Cookies" },
      {
        type: "paragraph",
        text: "These cookies help us understand how visitors interact with our website so we can improve its performance. Information collected may include:",
      },
      {
        type: "list",
        items: [
          "Number of visitors",
          "Frequently visited pages",
          "Browser type",
          "Device type",
          "General geographic region",
          "Website performance statistics",
        ],
      },
      {
        type: "paragraph",
        text: "This information is collected in aggregated form and is not intended to directly identify individual users.",
      },
      { type: "subheading", text: "D. Security Cookies" },
      { type: "paragraph", text: "Security cookies help protect user accounts and prevent fraudulent activities. They may be used to:" },
      {
        type: "list",
        items: ["Detect suspicious login attempts", "Prevent unauthorized access", "Protect user sessions", "Improve platform security"],
      },
    ],
  },
  {
    id: "c4",
    num: "Section 04",
    title: "How We Use",
    emphasis: "Cookies",
    blocks: [
      { type: "paragraph", text: "APT uses cookies to:" },
      {
        type: "list",
        items: [
          "Maintain secure user sessions",
          "Authenticate registered users",
          "Remember user preferences",
          "Improve website performance",
          "Analyze website usage",
          "Detect security threats",
          "Enhance the overall user experience",
        ],
      },
    ],
    callout: {
      kind: "info",
      label: "Please note",
      text: "Cookies are not used to collect sensitive personal information without your knowledge.",
    },
  },
  {
    id: "c5",
    num: "Section 05",
    title: "Third-Party",
    emphasis: "Services",
    blocks: [
      {
        type: "paragraph",
        text: "APT may use trusted third-party services that utilize cookies or similar technologies to provide certain platform features, such as analytics, authentication, or payment processing.",
      },
      { type: "paragraph", text: "These third-party providers operate under their own privacy and cookie policies." },
    ],
  },
  {
    id: "c6",
    num: "Section 06",
    title: "Managing",
    emphasis: "Cookies",
    blocks: [
      { type: "paragraph", text: "Most web browsers allow users to:" },
      { type: "list", items: ["View stored cookies", "Delete cookies", "Block cookies"] },
    ],
    callout: {
      kind: "warning",
      label: "Please note",
      text: "Disabling certain cookies may affect the functionality of the APT website. Some features, such as secure login and account management, may not operate correctly if essential cookies are disabled.",
    },
  },
  {
    id: "c7",
    num: "Section 07",
    title: "Data Collected Through",
    emphasis: "Cookies",
    blocks: [
      { type: "paragraph", text: "Cookies used by APT may collect limited technical information, including:" },
      {
        type: "list",
        items: [
          "Browser type",
          "Device type",
          "Operating system",
          "IP address",
          "Session identifiers",
          "Date and time of website access",
          "Website usage statistics",
        ],
      },
      {
        type: "paragraph",
        text: "The information collected through cookies is used solely for improving website functionality, performance, and security.",
      },
    ],
  },
  {
    id: "c8",
    num: "Section 08",
    title: "Cookie",
    emphasis: "Retention",
    blocks: [
      {
        type: "paragraph",
        text: `Some cookies remain on your device only while your browser session is active ("Session Cookies"), while others remain for a limited period to remember your preferences ("Persistent Cookies").`,
      },
      {
        type: "paragraph",
        text: "Cookies are retained only for as long as necessary to fulfill their intended purpose or as required by applicable law.",
      },
    ],
  },
  {
    id: "c9",
    num: "Section 09",
    title: "Changes to This Cookie",
    emphasis: "Policy",
    blocks: [
      {
        type: "paragraph",
        text: "APT may update this Cookie Policy from time to time to reflect changes in technology, legal requirements, or improvements to our services.",
      },
      {
        type: "paragraph",
        text: "Users are encouraged to review this Policy periodically. Continued use of the website after updates constitutes acceptance of the revised Cookie Policy.",
      },
    ],
  },
];