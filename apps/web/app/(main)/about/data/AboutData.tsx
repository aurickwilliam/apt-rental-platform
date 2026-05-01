export type TeamMember = {
  name: string;
  role: string;
  bio: string;
  image: string;
  imageHeight: string;
  github: string | null;
  linkedin: string | null;
  // insertt social media links here later if needed
};

export const teamMembers = [
  {
    name: "Aurick William Lorenzo",
    role: "Lead Developer",
    bio: "Fullstack engineer with a love for clean code. Built APT's core matching engine and Supabase backend. ============ Kuromi tulong",
    image: "/images/orik.jpg",
    imageHeight: "h-63",
    github: "https://github.com/aurickwilliam",
    linkedin: null,
  },
  {
    name: "Mhart Aaron Navales",
    role: "Full Stack Yearner",
    bio: "Contributions: 21 git commits, 14 TikTok repost per day, and 1 unsint message.",
    image: "/images/ron.jpg",
    imageHeight: "h-56",
    github: "https://github.com/Kaironnnn",
    linkedin: null,
  },
  {
    name: "Michael Jann Mateo",
    role: "Project Manager",
    bio: "A good Project Manager. Lover boy specialist. Current RS status is unknown.",
    image: "/images/mija.jpg",
    imageHeight: "h-63",
    github: "https://github.com/YuriPatriotic",
    linkedin: null,
  },
  {
    name: "Charle Fulgencio",
    role: "Project Coordinator",
    bio: "Exists in theory. Confirmed present during exam week only. Shows up when it matters.",
    image: "/images/charle.jpg",
    imageHeight: "h-61",
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
