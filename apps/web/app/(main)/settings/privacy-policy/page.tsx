"use client";

import SettingsShell from "../components/SettingsShell";
import { SECTIONS } from "@/app/(main)/cookies/data/cookies-sections";

export default function PrivacyPolicyPage() {
  return (
    <SettingsShell title="Privacy Policy" subtitle="Last updated: June 2025" showBack>
      <div className="p-4 sm:p-5 divide-y divide-border">
        <div className="pt-6">
          <div className="space-y-6 divide-y divide-border">
            {SECTIONS.map((section, index) => (
              <div key={section.id} className={index > 0 ? "pt-6" : ""}>
                <h2 className="font-nunito font-semibold text-sm text-foreground mb-2">
                  {section.num}: {section.title} {section.emphasis}
                </h2>
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
        </div>
      </div>
    </SettingsShell>
  );
}