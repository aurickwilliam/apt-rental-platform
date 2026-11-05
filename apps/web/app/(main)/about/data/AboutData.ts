import { ABOUT_STATS, TEAM_MEMBERS, type TeamMember } from "@repo/constants";

export type { TeamMember };

// Copy is shared with the mobile About screen (`@repo/constants`); only the
// photos live here because they are served from this app's /public folder.
const MEMBER_IMAGES: Record<TeamMember["id"], string> = {
  aurick: "/images/orik.jpg",
  mhart: "/images/ron.webp",
  michael: "/images/mija.jpg",
  charle: "/images/charle.jpg",
};

export const teamMembers = TEAM_MEMBERS.map((member) => ({
  ...member,
  image: MEMBER_IMAGES[member.id],
}));

export const stats = ABOUT_STATS;
