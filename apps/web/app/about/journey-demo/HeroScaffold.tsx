import Image from "next/image";
import Link from "next/link";
import { Button, buttonVariants } from "@heroui/react";
import { IconArrowRight, IconRosetteDiscountCheck } from "@tabler/icons-react";
import design from "@/app/(main)/components/landing-design.module.css";

/** Same Hero geometry; deliberately no download action, session or backend imports. */
export default function HeroScaffold() {
  return (
    <section aria-labelledby="preview-home-title" className="grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:py-24">
      <div>
        <h1 id="preview-home-title" className={`font-nunito text-foreground ${design.heroTitle}`}>
          Find your place<span className="text-brand">.</span><br />Feel at home.
        </h1>
        <p className={`mt-6 text-lg text-foreground/75 ${design.heroDescription}`}>
          Discover apartments, connect with property owners, and manage your rental journey in one place.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap">
          <Link href="/browse" prefetch={false} className={buttonVariants({ variant: "primary", className: "landing-cta" })}>
            Explore apartments <IconArrowRight size={16} aria-hidden="true" />
          </Link>
          <Button variant="outline" isDisabled className="landing-cta">Download reference</Button>
        </div>
        <p className="mt-5 flex items-center gap-2 text-sm leading-6 text-foreground/75">
          <IconRosetteDiscountCheck size={16} aria-hidden="true" className="shrink-0 text-secondary-foreground" />
          Caloocan, Malabon, Navotas, and Valenzuela
        </p>
      </div>
      <Image
        src="/landing/hero-living-room.png"
        alt="Interior artwork used by the production landing page"
        width={1824} height={1704}
        sizes="(min-width: 1280px) 592px, (min-width: 1024px) calc(50vw - 48px), calc(100vw - 48px)"
        preload className="aspect-[4/3] w-full rounded-2xl object-cover lg:aspect-[76/71]"
      />
    </section>
  );
}
