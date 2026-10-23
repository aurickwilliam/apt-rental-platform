"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";

import { Accordion, Card, Link } from "@heroui/react";

export interface LegalTocItem {
  id: string;
  label: string;
}

interface LegalTableOfContentsProps {
  items: LegalTocItem[];
}

const ROW_CLASS = [
  "group relative flex h-auto w-full items-center gap-3 rounded-lg px-3 py-2 lg:min-h-6 lg:gap-2 lg:px-2 lg:py-0.5",
  "font-nunito text-[15px] font-normal leading-snug transition-colors hover:no-underline active:no-underline lg:text-[13px] lg:leading-4",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
].join(" ");
const ACTIVE_ROW = "bg-brand/10 font-semibold text-brand";
const IDLE_ROW =
  "text-muted-foreground hover:bg-muted/60 hover:text-foreground";
const BADGE_CLASS =
  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold leading-none tabular-nums transition-colors lg:size-5 lg:text-[10px]";
const ACTIVE_BADGE = "bg-brand/15 text-brand";
const IDLE_BADGE =
  "bg-muted text-muted-foreground group-hover:text-foreground";
const CONTENTS_STICKY_TOP = 80;
const CONTENTS_BOTTOM_CLEARANCE = 16;

export default function LegalTableOfContents({
  items,
}: LegalTableOfContentsProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const [canStick, setCanStick] = useState(false);
  const desktopNavRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = desktopNavRef.current;
    if (!nav) return;

    const updateStickyFit = () => {
      const height = nav.getBoundingClientRect().height;
      setCanStick(
        height > 0 &&
          height + CONTENTS_STICKY_TOP + CONTENTS_BOTTOM_CLEARANCE <=
            window.innerHeight,
      );
    };

    const observer = new ResizeObserver(updateStickyFit);
    observer.observe(nav);
    window.addEventListener("resize", updateStickyFit);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateStickyFit);
    };
  }, []);

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-legal-section]"),
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-96px 0px -65% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const handleNavigate = (
    event: MouseEvent,
    id: string,
  ) => {
    const target = document.getElementById(id);
    if (!target) return;

    event.preventDefault();
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    target.focus({ preventScroll: true });
    target.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
    setActiveId(id);
    window.history.replaceState(null, "", `#${id}`);
  };

  const links = (
    <ol className="flex flex-col gap-2 lg:gap-0.5">
      {items.map((item, index) => {
        const isActive = item.id === activeId;

        return (
          <li key={item.id}>
            <Link
              href={`#${item.id}`}
              aria-current={isActive ? "location" : undefined}
              onClick={(event) => handleNavigate(event, item.id)}
              className={[ROW_CLASS, isActive ? ACTIVE_ROW : IDLE_ROW].join(" ")}
            >
              {isActive ? (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-brand lg:h-4 lg:w-0.5"
                />
              ) : null}
              <span
                aria-hidden="true"
                className={[
                  BADGE_CLASS,
                  isActive ? ACTIVE_BADGE : IDLE_BADGE,
                ].join(" ")}
              >
                <span className="block leading-none lg:translate-y-px">
                  {index + 1}
                </span>
              </span>
              <span>{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );

  return (
    <>
      <nav
        ref={desktopNavRef}
        aria-label="Contents"
        className={`hidden self-start lg:block${canStick ? " sticky" : ""}`}
        style={{ top: CONTENTS_STICKY_TOP }}
      >
        <Card className="gap-0 rounded-xl border border-border bg-card p-3 shadow-none">
          <Card.Header className="px-2 pb-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Contents
            </p>
          </Card.Header>
          <Card.Content>{links}</Card.Content>
        </Card>
      </nav>

      <div className="rounded-xl border border-border bg-card lg:hidden">
        <Accordion hideSeparator>
          <Accordion.Item id="legal-contents">
            <Accordion.Heading>
              <Accordion.Trigger className="font-nunito text-base font-bold text-foreground">
                Contents
                <Accordion.Indicator className="text-muted-foreground" />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body className="pt-0">{links}</Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>
      </div>
    </>
  );
}
