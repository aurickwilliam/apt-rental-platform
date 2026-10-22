import { Skeleton } from "@heroui/react";

const BUBBLES = [
  { mine: false, width: "w-2/3", height: "h-12" },
  { mine: false, width: "w-1/3", height: "h-10" },
  { mine: true, width: "w-1/2", height: "h-12" },
  { mine: false, width: "w-3/5", height: "h-16" },
  { mine: true, width: "w-2/5", height: "h-10" },
  { mine: true, width: "w-1/3", height: "h-12" },
] as const;

/** Placeholder for a conversation thread while its messages load (mirrors the bubble layout, no private data). */
export default function ConversationThreadSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading conversation" className="flex w-full flex-col gap-3 py-2">
      {BUBBLES.map((bubble, index) => (
        <div key={index} className={`flex items-end gap-2 ${bubble.mine ? "justify-end" : ""}`}>
          {bubble.mine ? null : <Skeleton className="size-7 shrink-0 rounded-full bg-grey-300!" />}
          <Skeleton className={`${bubble.height} ${bubble.width} rounded-3xl bg-grey-300!`} />
        </div>
      ))}
    </div>
  );
}
