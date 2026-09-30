import SharedUserAvatar from "@/app/components/profile/UserAvatar";

interface ProfilePhotoProps {
  src: string | null;
  name: string;
  initials: string;
}

export default function ProfilePhoto({ src, name, initials }: ProfilePhotoProps) {
  return (
    <div className="relative -mt-12 size-24 shrink-0">
      <SharedUserAvatar
        src={src}
        initials={initials}
        alt={name}
        className="size-24 rounded-full border-4 border-background bg-primary"
        fallbackClassName="rounded-full bg-primary text-xl font-bold text-white"
      />
    </div>
  );
}
