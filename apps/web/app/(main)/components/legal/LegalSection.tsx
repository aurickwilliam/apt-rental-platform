import type { ReactNode } from "react";

import { Alert, Card, Chip } from "@heroui/react";
import {
  IconAlertTriangleFilled,
  IconInfoCircleFilled,
} from "@tabler/icons-react";

export type LegalCallout = {
  kind: "info" | "warning";
  label: string;
  text: string;
};

interface LegalSectionProps {
  id: string;
  num: string;
  title: string;
  emphasis: string;
  callout?: LegalCallout;
  headingLevel?: 2 | 3;
  children: ReactNode;
}

export default function LegalSection({
  id,
  num,
  title,
  emphasis,
  callout,
  headingLevel = 2,
  children,
}: LegalSectionProps) {
  const headingId = `${id}-heading`;
  const isWarning = callout?.kind === "warning";
  const Heading = headingLevel === 3 ? "h3" : "h2";

  return (
    <section
      id={id}
      data-legal-section
      tabIndex={-1}
      aria-labelledby={headingId}
      className="mt-5 scroll-mt-28 first:mt-0 focus:outline-none"
    >
      <Card className="rounded-xl border border-border/70 bg-card p-5 text-card-foreground shadow-none sm:p-6">
        <Card.Header className="gap-2">
          <Chip
            size="sm"
            variant="soft"
            color="accent"
            className="w-fit rounded-full bg-primary/10 px-2.5 py-0 text-brand dark:bg-primary/15"
          >
            <Chip.Label className="px-0 text-[11px] font-bold uppercase leading-5 tracking-wider text-brand">
              {num}
            </Chip.Label>
          </Chip>

          <Heading
            id={headingId}
            className="font-nunito text-xl font-bold leading-snug text-foreground sm:text-2xl"
          >
            {title ? `${title} ` : ""}
            <span className="text-brand">{emphasis}</span>
          </Heading>
        </Card.Header>

        <Card.Content className="gap-3 text-[15px] leading-6 text-foreground/80">
          {children}
        </Card.Content>

        {callout ? (
          <Alert
            status={isWarning ? "warning" : "accent"}
            role="note"
            className={`gap-2.5 rounded-lg border-0 px-4 py-3 shadow-none ${
              isWarning
                ? "bg-[var(--warning-soft)]"
                : "bg-light-blue dark:bg-primary/10"
            }`}
          >
            <Alert.Indicator
              className={`self-center! p-0 ${
                isWarning ? "text-warning" : "text-primary"
              }`}
            >
              {isWarning ? (
                <IconAlertTriangleFilled size={18} aria-hidden="true" />
              ) : (
                <IconInfoCircleFilled size={18} aria-hidden="true" />
              )}
            </Alert.Indicator>
            <Alert.Content>
              <Alert.Title className="sr-only">{callout.label}</Alert.Title>
              <Alert.Description className="text-sm leading-6 text-foreground/80">
                {callout.text}
              </Alert.Description>
            </Alert.Content>
          </Alert>
        ) : null}
      </Card>
    </section>
  );
}
