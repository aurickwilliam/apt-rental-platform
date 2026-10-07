import Image from "next/image";
import { IconBuilding, IconFileText } from "@tabler/icons-react";

import SharedUserAvatar from "@/app/components/profile/UserAvatar";

interface VerificationImageProps {
  kind: "users" | "apartments" | "documents";
  image: string | null;
  name: string;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function VerificationImage({
  kind,
  image,
  name,
}: VerificationImageProps) {
  if (kind === "apartments") {
    return image ? (
      <Image
        src={image}
        alt=""
        unoptimized
        width={44}
        height={44}
        className="size-11 shrink-0 rounded-lg object-cover"
      />
    ) : (
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <IconBuilding size={20} aria-hidden="true" />
      </span>
    );
  }
  if (kind === "documents") {
    return (
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <IconFileText size={20} aria-hidden="true" />
      </span>
    );
  }
  return (
    <SharedUserAvatar
      src={image}
      initials={initials(name)}
      alt={name}
      size="sm"
      className="shrink-0 bg-primary/10 text-primary"
      fallbackClassName="bg-primary/10 text-primary"
    />
  );
}
