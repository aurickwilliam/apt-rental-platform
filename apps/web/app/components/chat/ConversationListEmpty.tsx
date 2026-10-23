import type { ComponentType } from "react";

interface ConversationListEmptyProps {
  icon: ComponentType<{ size?: number; "aria-hidden"?: boolean }>;
  title: string;
  description: string;
}

/** Centered empty state for a conversation list (icon in a muted circle, title, hint). */
export default function ConversationListEmpty({ icon: Icon, title, description }: ConversationListEmptyProps) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-secondary text-primary">
        <Icon size={30} aria-hidden />
      </div>
      <p className="mt-4 font-nunito text-base font-bold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
