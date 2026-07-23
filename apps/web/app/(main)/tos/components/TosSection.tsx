// apps/web/app/(main)/tos/components/TosSection.tsx
import { Alert } from "@heroui/react";
import type { Section } from "../data/tos-sections";

type TosSectionProps = {
  section: Section;
  isLast: boolean;
  sectionRef: (el: HTMLDivElement | null) => void;
};

export default function TosSection({ section, isLast, sectionRef }: TosSectionProps) {
  const isWarning = section.callout?.kind === "warning";

  return (
    <div>
      <div id={section.id} ref={sectionRef} className="scroll-mt-24 mb-13">
        <div className="mb-2 text-xs font-poppinsSemiBold uppercase tracking-widest text-primary">
          {section.num}
        </div>
        <h2 className="mb-4 text-2xl font-inter font-semibold tracking-tight">
          {section.title ? `${section.title} ` : ""}
          <em className="text-primary not-italic font-inter font-semibold">{section.emphasis}</em>
        </h2>

        {section.intro && (
          <p className="mb-3 text-sm text-default-700 leading-relaxed">{section.intro}</p>
        )}

        {section.list && (
          <ul className="my-3.5 list-none">
            {section.list.map((item, idx) => (
              <li
                key={idx}
                className="relative border-b border-default-200 py-2 pl-5 text-sm text-default-700 leading-relaxed last:border-none"
              >
                <span className="absolute left-0 top-[15px] h-1.5 w-1.5 rounded-full bg-primary opacity-50" />
                {item}
              </li>
            ))}
          </ul>
        )}

        {section.body?.map((p, idx) => (
          <p key={idx} className="mb-3 text-sm text-default-700 leading-relaxed last:mb-0">
            {p}
          </p>
        ))}

        {section.callout && (
          <Alert color={isWarning ? "warning" : "primary"} className="mt-5">
            <Alert.Content>
              <Alert.Title className="font-poppinsSemiBold text-foreground">
                {section.callout.label}
              </Alert.Title>
              <Alert.Description className="text-foreground/80">
                {section.callout.text}
              </Alert.Description>
            </Alert.Content>
          </Alert>
        )}
      </div>
      {!isLast && <hr className="mb-13 border-t border-default-200" />}
    </div>
  );
}