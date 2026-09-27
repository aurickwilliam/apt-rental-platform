"use client";

import SettingsShell from "../components/SettingsShell";
import { SECTIONS } from "@/app/(main)/tos/data/tos-sections";

export default function TermsPage() {
  return (
    <SettingsShell title="Terms and Conditions" subtitle="Last updated: June 2025" showBack>
      <div className="p-4 sm:p-5 divide-y divide-border">
        <div className="pt-6">
          <div className="space-y-6 divide-y divide-border">
            {SECTIONS.map((section, index) => (
              <div key={section.id} className={index > 0 ? "pt-6" : ""}>
                <h2 className="font-nunito font-semibold text-sm text-foreground mb-2">
                  {section.num}: {section.title} {section.emphasis}
                </h2>
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