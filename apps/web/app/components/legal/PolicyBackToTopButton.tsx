"use client";

import { Button } from "@heroui/react";
import { IconArrowUp } from "@tabler/icons-react";
import { useSyncExternalStore } from "react";

interface PolicyBackToTopButtonProps {
  headingId: string;
}

function subscribeScroll(onChange: () => void): () => void {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}

const getScrolledSnapshot = () => window.scrollY > 0;
const getServerSnapshot = () => false;

export default function PolicyBackToTopButton({ headingId }: PolicyBackToTopButtonProps) {
  // A boolean snapshot changes only when crossing the top, not on every frame.
  // The server stays hidden; restored client scroll positions are read on mount.
  const visible = useSyncExternalStore(subscribeScroll, getScrolledSnapshot, getServerSnapshot);

  const scrollToTop = () => {
    const heading = document.getElementById(headingId);
    if (!heading) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    heading.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: reduceMotion ? "instant" : "smooth" });
  };

  return visible ? (
    <div
      data-fab-clearance="policy-back-to-top"
      className="fixed z-30 rounded-full bg-background shadow-md"
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))", right: "calc(1rem + env(safe-area-inset-right, 0px))" }}
    >
      <Button type="button" variant="outline" className="min-h-11" onPress={scrollToTop}>
        <IconArrowUp size={18} aria-hidden="true" />
        Back to top
      </Button>
    </div>
  ) : null;
}
