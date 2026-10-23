import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse motion-reduce:animate-none rounded-md bg-skeleton", className)}
      {...props}
    />
  )
}

export { Skeleton }
