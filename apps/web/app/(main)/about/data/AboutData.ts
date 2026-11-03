export type TeamMember = {
  name: string;
  role: string;
  bio: string;
  image: string;
  github: string | null;
  linkedin: string | null;
};

export const teamMembers = [
  {
    name: "Aurick William Lorenzo",
    role: "Lead Developer",
    bio: "Full-stack engineer who led APT's architecture — the matching engine, payments, and the Supabase backend he keeps clean, secure, and fast.",
    image: "/images/orik.jpg",
    github: "https://github.com/aurickwilliam",
    linkedin: "https://www.linkedin.com/in/aurick-william-lorenzo-ba83a73a6/?skipRedirect=true",
  },
  {
    name: "Mhart Aaron Navales",
    role: "Full-Stack Developer & UI/UX",
    bio: "Full-stack developer and UI/UX designer; builds APT's screens end-to-end and keeps the experience friendly on every device.",
    image: "/images/ron.jpg",
    github: "https://github.com/Kaironnnn",
    linkedin: null,
  },
  {
    name: "Michael Jann Mateo",
    role: "Backend Developer & Project Manager",
    bio: "Backend developer and project manager; coordinates the roadmap, reviews the data model, and keeps releases on schedule.",
    image: "/images/mija.jpg",
    github: "https://github.com/YuriPatriotic",
    linkedin: null,
  },
  {
    name: "Charle Fulgencio",
    role: "Quality Assurance & Documentation",
    bio: "Quality assurance and documentation lead; tests every release against real rentals and keeps our guides accurate.",
    image: "/images/charle.jpg",
    github: "https://github.com/KhromaUnus",
    linkedin: null,
  },
];

export const stats = [
  { label: "Team Members", value: "4" },
  { label: "Based in", value: "Caloocan" },
  { label: "Built for", value: "Philippines" },
  { label: "Areas Covered", value: "CAMANAVA" },
];
