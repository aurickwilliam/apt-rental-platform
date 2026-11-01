import { Card, Link } from "@heroui/react";
import {
  IconClock,
  IconMail,
  IconMapPin,
} from "@tabler/icons-react";

import LegalPolicyLink from "./LegalPolicyLink";

export interface LegalBrand {
  email: string;
  address: string;
  hours: string;
}

interface LegalContactCardProps {
  brand: LegalBrand;
  related?: { href: string; label: string }[];
  eyebrow?: string;
  description?: string | null;
  headingLevel?: 2 | 3;
}

export default function LegalContactCard({
  brand,
  related = [],
  eyebrow = "Questions?",
  description = "Reach us about these terms or how your information is handled.",
  headingLevel = 2,
}: LegalContactCardProps) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const details = [
    { label: "Address", value: brand.address, icon: IconMapPin },
    { label: "Hours", value: brand.hours, icon: IconClock },
  ];

  return (
    <Card className="mt-12 rounded-2xl border border-border bg-card p-6 shadow-none sm:p-8">
      <Card.Content className="gap-5 p-0">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">
            {eyebrow}
          </p>
          <Heading className="mt-1 font-nunito text-lg font-bold text-primary">
            Contact APT
          </Heading>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>

        <ul className="flex flex-col gap-4">
          <li className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconMail size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </p>
              <Link
                href={`mailto:${brand.email}`}
                className="break-all text-sm font-medium text-brand hover:underline"
              >
                {brand.email}
              </Link>
            </div>
          </li>

          {details.map(({ label, value, icon: Icon }) => (
            <li key={label} className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                <p className="text-sm text-foreground">{value}</p>
              </div>
            </li>
          ))}
        </ul>

        {related.length > 0 ? (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-sm">
            {related.map((item) => (
              <LegalPolicyLink
                key={item.href}
                href={item.href}
                className="font-medium text-brand hover:underline"
              >
                {item.label}
              </LegalPolicyLink>
            ))}
          </div>
        ) : null}
      </Card.Content>
    </Card>
  );
}
