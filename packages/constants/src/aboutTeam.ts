/** Copy for the About Us pages, shared by web and mobile so the two never drift. */

export interface TeamMember {
  /** Stable key; platforms map it to their own photo asset. */
  id: "aurick" | "mhart" | "michael" | "charle";
  name: string;
  role: string;
  bio: string;
  github: string | null;
  linkedin: string | null;
}

export const TEAM_MEMBERS: readonly TeamMember[] = [
  {
    id: "aurick",
    name: "Aurick William Lorenzo",
    role: "Lead Developer",
    bio: "Designed APT's architecture end to end, from the Supabase backend and its security rules to payments and the apps. Keeps every release secure, fast and easy to maintain.",
    github: "https://github.com/aurickwilliam",
    linkedin:
      "https://www.linkedin.com/in/aurick-william-lorenzo-ba83a73a6/?skipRedirect=true",
  },
  {
    id: "mhart",
    name: "Mhart Aaron Navales",
    role: "Full-Stack Developer & UI/UX",
    bio: "Designs and builds APT's screens from first sketch to working feature, so renting feels clear and friendly on every device.",
    github: "https://github.com/Kaironnnn",
    linkedin: null,
  },
  {
    id: "michael",
    name: "Michael Jann Mateo",
    role: "Backend Developer & Project Manager",
    bio: "Shapes the data behind APT and keeps the team on track. Plans the roadmap, reviews the data model and makes sure releases land on schedule.",
    github: "https://github.com/YuriPatriotic",
    linkedin: null,
  },
  {
    id: "charle",
    name: "Charle Fulgencio",
    role: "Quality Assurance & Documentation",
    bio: "Tests every release against real rental situations, from applying to paying rent, and writes the guides that help people use APT with confidence.",
    github: "https://github.com/KhromaUnus",
    linkedin: null,
  },
];

export const ABOUT_STATS = [
  { label: "Team Members", value: "4" },
  { label: "Based in", value: "Caloocan" },
  { label: "Built for", value: "Philippines" },
  { label: "Areas Covered", value: "CAMANAVA" },
] as const;

export const ABOUT_MISSION =
  "To make renting in the Philippines simpler, safer, and more transparent, connecting tenants and property owners through a trusted digital platform built for the Filipino community.";

export const ABOUT_VISION =
  "To become the most trusted rental platform in the Philippines, where every Filipino can find a home they are proud of with confidence, ease, and peace of mind.";

export const ABOUT_OFFICE_ADDRESS =
  "109 Samson Road corner Caimito Road, Caloocan, Philippines";

export const ABOUT_COVERAGE =
  "Serving the CAMANAVA area: Caloocan, Malabon, Navotas, and Valenzuela";
