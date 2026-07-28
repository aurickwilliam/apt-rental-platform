"use client";

import { useEffect, useRef, useState } from "react";
import PapHero from "./components/PapHero";
import PapTableOfContents from "./components/PapTableOfContents";
import PapSection from "./components/PapSection";
import PapContact from "./components/PapContact";
import { SECTIONS } from "./data/pap-sections";

export default function PapPage() {
  const [activeId, setActiveId] = useState<string>("p1");
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
      <PapHero />

      <div className="mx-auto max-w-7xl grid grid-cols-1 gap-0 px-4 md:px-12 md:grid-cols-[240px_1fr]">
        <PapTableOfContents activeId={activeId} onNavigate={scrollTo} />

        <div className="border-l-0 md:border-l border-default-200 py-10 md:pl-12 pb-20">
          {SECTIONS.map((section, i) => (
            <PapSection
              key={section.id}
              section={section}
              isLast={i === SECTIONS.length - 1}
              sectionRef={(el) => (sectionRefs.current[section.id] = el)}
            />
          ))}
          <PapContact />
        </div>
      </div>
    </div>
  );
}
