import { Avatar } from "@heroui/react";
import { getInitials, type AdminUser } from "../lib/user-display";

interface UserAvatarProps {
  user: AdminUser;
  name: string;
}

export default function UserAvatar({ user, name }: UserAvatarProps) {
  return (
    <Avatar size="sm" className="shrink-0 bg-primary/10 text-primary">
      {user.avatar_url ? <Avatar.Image src={user.avatar_url} alt="" /> : null}
      <Avatar.Fallback className="bg-primary/10 text-primary">
        {getInitials(name)}
      </Avatar.Fallback>
    </Avatar>
  );
}
