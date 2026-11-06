"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@heroui/react";

import type { TutorialStep } from "@repo/utils";
import {
  computeTutorialPlacement,
  type TutorialBox,
} from "@/lib/tutorial-placement";

interface TutorialStepLayerProps {
  step: TutorialStep;
  stepIndex: number;
  stepCount: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

const CARD_WIDTH = 360;
const ESTIMATED_CARD_HEIGHT = 230;
const SPOTLIGHT_PADDING = 6;

/** The first element with this key that is actually on screen (the desktop sidebar and the mobile drawer both carry it). */
function findVisibleTarget(key: string): HTMLElement | null {
  const candidates = document.querySelectorAll<HTMLElement>(`[data-tour="${key}"]`);
  for (const element of candidates) {
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return element;
  }
  return null;
}

function readBox(element: HTMLElement): TutorialBox {
  const rect = element.getBoundingClientRect();
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
}

/**
 * One tour step drawn over the page: a spotlight around the target (found by
 * its stable `data-tour` key) and a card beside it. A missing or hidden target
 * shows the card on its own. The layer is remounted per step (`key`), so
 * measurements never outlive their step.
 */
export default function TutorialStepLayer({
  step,
  stepIndex,
  stepCount,
  onNext,
  onBack,
  onSkip,
}: TutorialStepLayerProps) {
  const [target, setTarget] = useState<TutorialBox | null>(null);
  const [viewport, setViewport] = useState<{ width: number; height: number }>(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  const [cardHeight, setCardHeight] = useState(ESTIMATED_CARD_HEIGHT);
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const frame = useRef(0);
  const isLast = stepIndex === stepCount - 1;

  const measure = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
      const element = step.targetKey ? findVisibleTarget(step.targetKey) : null;
      setTarget(element ? readBox(element) : null);
    });
  }, [step.targetKey]);

  useEffect(() => {
    if (step.targetKey) findVisibleTarget(step.targetKey)?.scrollIntoView({ block: "nearest" });
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure, step.targetKey]);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setCardHeight(element.offsetHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Move focus into the card on every step so keyboard users follow along.
  useEffect(() => {
    nextRef.current?.focus();
  }, [step.id]);

  const placement = computeTutorialPlacement({
    target,
    viewport,
    card: { width: CARD_WIDTH, height: cardHeight },
  });

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onSkip();
      return;
    }
    if (event.key !== "Tab") return;
    const controls = cardRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])");
    if (!controls || controls.length === 0) return;
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[1000] ${target ? "" : "bg-black/55"}`}
      onKeyDown={handleKeyDown}
      data-testid="tutorial-layer"
    >
      {target ? (
        <div
          aria-hidden="true"
          data-testid="tutorial-spotlight"
          className="pointer-events-none fixed rounded-2xl ring-2 ring-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] motion-safe:transition-[top,left,width,height] motion-safe:duration-200"
          style={{
            top: target.top - SPOTLIGHT_PADDING,
            left: target.left - SPOTLIGHT_PADDING,
            width: target.width + SPOTLIGHT_PADDING * 2,
            height: target.height + SPOTLIGHT_PADDING * 2,
          }}
        />
      ) : null}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-step-title"
        aria-describedby="tutorial-step-description"
        className="fixed flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-lg motion-safe:transition-[top,left] motion-safe:duration-200"
        style={{ top: placement.top, left: placement.left, width: placement.width }}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-muted-foreground" aria-live="polite">
            Step {stepIndex + 1} of {stepCount}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onPress={onSkip}
            className="button--bare cursor-pointer text-sm font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Skip Tutorial
          </Button>
        </div>

        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: stepCount }, (_, index) => (
            <span
              key={index}
              className={`h-1 flex-1 rounded-full ${index <= stepIndex ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>

        <h2 id="tutorial-step-title" className="font-nunito text-lg font-bold text-foreground">
          {step.title}
        </h2>
        <p id="tutorial-step-description" className="text-sm leading-6 text-muted-foreground">
          {step.description}
        </p>

        <div className="flex gap-2 pt-1">
          {stepIndex > 0 ? (
            <Button variant="outline" onPress={onBack} className="min-h-10 flex-1 cursor-pointer">
              Back
            </Button>
          ) : null}
          <Button
            ref={nextRef}
            variant="primary"
            onPress={onNext}
            className="min-h-10 flex-1 cursor-pointer"
          >
            {isLast ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
