"use client";

import { IconRoute } from "@tabler/icons-react";

import SettingsRow from "../SettingsRow";

export default function TutorialTab({
  portal,
  onStart,
}: {
  portal: "tenant" | "landlord";
  onStart: () => void;
}) {
  return (
    <>
      <h2 className="font-nunito text-lg font-bold text-primary">Tutorial</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        A short tour of where to find things in APT.
      </p>
      <div className="mt-3 divide-y divide-border rounded-xl border border-border">
        <SettingsRow
          icon={<IconRoute size={18} />}
          title="Replay the tutorial"
          description={portal === "tenant" ? "Tour the tenant features" : "Tour the landlord features"}
          onClick={onStart}
        />
      </div>
    </>
  );
}
