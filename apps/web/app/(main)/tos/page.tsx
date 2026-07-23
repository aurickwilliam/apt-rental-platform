"use client";

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