import type { ReactNode } from "react";

import { Chip } from "@heroui/react";

import {
  IconCalendar,
  IconStack2,
  IconWorld,
} from "@tabler/icons-react";

export interface LegalMeta {
  lastUpdated: string;
  jurisdiction: string;
  version: string;
}

interface LegalHeroProps {
  eyebrow: string;
  title: string;
  titleAccent: string;
  description: string;
  meta: LegalMeta;
  icon: ReactNode;
}

export default function LegalHero({
  eyebrow,
  title,
  titleAccent,
  description,
  meta,
  icon,
}: LegalHeroProps) {
  return (
    <header className="border-b border-border bg-light-blue/60 dark:bg-primary/10">
      <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-7 sm:px-6 sm:pb-10 sm:pt-9">
        <div className="flex flex-col gap-3">
          <Chip
            color="accent"
            variant="soft"
            className="w-fit gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-[11px] font-bold uppercase leading-normal tracking-wider text-brand"
          >
            {icon}
            <Chip.Label className="px-0 text-brand">{eyebrow}</Chip.Label>
          </Chip>

          <h1 className="font-nunito text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
            {title ? `${title} ` : ""}
            <span className="text-brand">{titleAccent}</span>
          </h1>

          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>

          <ul className="mt-1 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-muted-foreground sm:text-sm">
            <li className="flex items-center gap-2">
              <IconCalendar size={16} aria-hidden="true" />
              Last updated: {meta.lastUpdated}
            </li>
            <li className="flex items-center gap-2">
              <IconWorld size={16} aria-hidden="true" />
              {meta.jurisdiction}
            </li>
            <li className="flex items-center gap-2">
              <IconStack2 size={16} aria-hidden="true" />
              Version {meta.version}
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
