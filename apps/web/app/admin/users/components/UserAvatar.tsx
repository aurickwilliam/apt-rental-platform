import SharedUserAvatar from "@/app/components/profile/UserAvatar";
import { getInitials, type AdminUser } from "../lib/user-display";

interface UserAvatarProps {
  user: AdminUser;
  name: string;
}

export default function UserAvatar({ user, name }: UserAvatarProps) {
  return (
    <SharedUserAvatar
      src={user.avatar_url}
      initials={getInitials(name)}
      alt={name}
      size="sm"
      className="shrink-0 bg-primary/10 text-primary"
      fallbackClassName="bg-primary/10 text-primary"
    />
  );
}
