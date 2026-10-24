"use client";

import type { ReactNode } from "react";
import { useAuthIdentity } from "@/hooks/use-auth-identity";
import { matchesPresentationSeed, type PresentationSeed } from "@/service/presentation-seed";

interface PresentationBoundaryProps<T> {
  initial: PresentationSeed<T>;
  children: (seed: PresentationSeed<T> | undefined) => ReactNode;
}

/** Remounts drafts, callbacks and resources when the account generation changes. */
export default function PresentationBoundary<T>({ initial, children }: PresentationBoundaryProps<T>) {
  const identity = useAuthIdentity(initial.authUserId);
  const seed = matchesPresentationSeed(initial, identity, initial.resourceId) ? initial : undefined;
  return <div className="contents" key={`${identity.authUserId ?? "none"}:${identity.generation}:${initial.resourceId ?? "list"}:${seed?.renderedAt ?? "browser"}`}>{children(seed)}</div>;
}
