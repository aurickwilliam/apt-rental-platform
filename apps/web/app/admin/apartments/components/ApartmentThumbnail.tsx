import Image from "next/image";
import { IconBuilding } from "@tabler/icons-react";

interface ApartmentThumbnailProps {
  url: string | null;
}

export default function ApartmentThumbnail({ url }: ApartmentThumbnailProps) {
  if (url) {
    return (
      <Image
        src={url}
        alt=""
        unoptimized
        width={44}
        height={44}
        className="size-11 shrink-0 rounded-lg object-cover"
      />
    );
  }
  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <IconBuilding size={20} aria-hidden="true" />
    </span>
  );
}
