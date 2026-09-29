"use client";

import type { Section as TosSection } from "@/app/(main)/tos/data/tos-sections";
import type { Section as CookiesSection } from "@/app/(main)/cookies/data/cookies-sections";

type LegalSection = TosSection | CookiesSection;

function isCookiesSection(section: LegalSection): section is CookiesSection {
  return "blocks" in section;
}

function TosContent({ section }: { section: TosSection }) {
  return (
    <>
      {section.intro && <p className="text-sm text-muted-foreground mb-3">{section.intro}</p>}
      {section.list && (
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-3">
          {section.list.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
      {section.body && (
        <div className="space-y-3 text-sm text-muted-foreground">
          {section.body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      )}
    </>
  );
}

function CookiesBlocks({ section }: { section: CookiesSection }) {
  return (
    <>
      {section.blocks.map((block, i) => {
        if (block.type === "paragraph") {
          return <p key={i} className="text-sm text-muted-foreground mb-3">{block.text}</p>;
        }
        if (block.type === "subheading") {
          return <p key={i} className="font-nunito font-semibold text-sm text-foreground mb-2 mt-4">{block.text}</p>;
        }
        if (block.type === "list") {
          return (
            <ul key={i} className="list-disc list-inside space-y-2 text-sm text-muted-foreground mb-3">
              {block.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          );
        }
        return null;
      })}
    </>
  );
}

export default function LegalSections({ sections }: { sections: LegalSection[] }) {
  return (
    <div className="space-y-6 divide-y divide-border">
      {sections.map((section, index) => (
        <div key={section.id} className={index > 0 ? "pt-6" : ""}>
          <h2 className="font-nunito font-semibold text-sm text-foreground mb-2">
            {section.num}: {section.title} {section.emphasis}
          </h2>
          {isCookiesSection(section) ? (
            <CookiesBlocks section={section} />
          ) : (
            <TosContent section={section} />
          )}
          {section.callout && (
            <div
              key="callout"
              className={`mt-3 p-3 rounded-lg text-sm ${
                section.callout.kind === "info"
                  ? "bg-primary/10 text-primary"
                  : "bg-warning/10 text-warning"
              }`}
            >
              <p className="font-nunito font-semibold">{section.callout.label}</p>
              <p>{section.callout.text}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
