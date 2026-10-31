import Image from "next/image";
import type { ReactNode } from "react";
import LandingReveal from "./LandingReveal";
import design from "./landing-design.module.css";

interface ProductShowcaseProps {
  number: string;
  label: string;
  title: string;
  paragraphs: readonly string[];
  image?: { src: string; alt: string; className?: string };
  media?: ReactNode;
  reversed?: boolean;
}

export default function ProductShowcase({ number, label, title, paragraphs, image, media, reversed = false }: ProductShowcaseProps) {
  return (
    <article data-product-chapter={reversed ? "manage" : "discover"} aria-label={label} className={reversed ? design.manageChapter : design.discoverChapter}>
      <div className={design.showcaseCopy}>
        <LandingReveal name={`${number}-label`} duration={0.7} distance={8} className={design.chapterLabel}>
          <p className={`uppercase text-secondary-foreground ${design.eyebrow}`}>
            {number} · {label}
          </p>
        </LandingReveal>
        <LandingReveal name={`${number}-title`} delay={0.07} duration={0.7} className={`mt-5 ${design.chapterHeading}`} distance={10}>
          <h3 className={`font-nunito text-foreground ${design.showcaseTitle}`}>
            {title}
          </h3>
        </LandingReveal>
        <div className={`mt-6 space-y-5 text-lg leading-8 text-foreground/75 ${design.showcaseBody}`}>
          {paragraphs.map((paragraph, index) => (
            <LandingReveal key={paragraph} name={`${number}-description-${index}`} delay={0.14 + index * 0.07} duration={0.7} distance={10}>
              <p>{paragraph}</p>
            </LandingReveal>
          ))}
        </div>
      </div>
      <div className={reversed ? design.manageMedia : design.discoverMedia}>
        {media ?? (image ? (
          <LandingReveal name={`${number}-image`} delay={0.13} duration={0.8} distance={9} className="relative aspect-[10/9] overflow-hidden rounded-2xl bg-muted/40">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              loading="lazy"
              sizes="(min-width: 1280px) 588px, (min-width: 1024px) calc(50vw - 52px), calc(100vw - 48px)"
              className={image.className ?? "object-contain p-4 sm:p-6"}
            />
          </LandingReveal>
        ) : null)}
      </div>
    </article>
  );
}
