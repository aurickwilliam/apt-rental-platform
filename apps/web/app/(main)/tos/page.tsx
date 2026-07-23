"use client";

/**
 * apps/web/app/(main)/tos/page.tsx
 * -------------------------------------------------------------
 * Terms of Service — APT (A Place to Thrive)
 *
 * This route is nested under app/(main)/layout.tsx, which already
 * renders <AppNavbar /> and <Footer /> around {children} — so this
 * file intentionally contains ONLY the page content. Do not add
 * nav/footer here.
 *
 * Content lives in ./data/tos-sections.ts; presentation is split
 * across ./components (TosHero, TosTableOfContents, TosSection,
 * TosContact). This file just wires them together and owns the
 * scrollspy state, since that state is shared between the sidebar
 * TOC and the section list.
 *
 * Built with HeroUI (https://heroui.com/en/docs/react/components).
 * Uses the project's Poppins font (font-poppins utility) and the same
 * typography/color conventions as app/(main)/about/page.tsx — font-inter
 * for headings, font-poppinsSemiBold for labels, the default-* color
 * scale for body/meta text, and border-default-200 for hairlines.
 *
 * Setup notes:
 * 1. Update BRAND.email / BRAND.address / "Last updated" date in
 *    ./data/tos-sections.ts as needed.
 * 2. The sticky TOC assumes AppNavbar is 64px tall (top-[64px] /
 *    h-[calc(100vh-64px)] in TosTableOfContents) — adjust if yours differs.
 */

import { useEffect, useRef, useState } from "react";
import TosHero from "./components/TosHero";
import TosTableOfContents from "./components/TosTableOfContents";
import TosSection from "./components/TosSection";
import TosContact from "./components/TosContact";
import { SECTIONS } from "./data/tos-sections";

export default function TosPage() {
  const [activeId, setActiveId] = useState<string>("s1");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen font-poppins">
      <TosHero />

      <div className="mx-auto max-w-7xl grid grid-cols-1 gap-0 px-4 md:px-12 md:grid-cols-[240px_1fr]">
        <TosTableOfContents activeId={activeId} onNavigate={scrollTo} />

        <div className="border-l-0 md:border-l border-default-200 py-10 md:pl-12 pb-20">
          {SECTIONS.map((section, i) => (
            <TosSection
              key={section.id}
              section={section}
              isLast={i === SECTIONS.length - 1}
              sectionRef={(el) => (sectionRefs.current[section.id] = el)}
            />
          ))}
          <TosContact />
        </div>
      </div>
    </div>
  );
}