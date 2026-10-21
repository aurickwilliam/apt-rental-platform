"use client";

import { financeGuidelineSections, manilaToday } from "@repo/utils";
import FinanceModal from "./FinanceModal";

export default function FinanceGuidelinesModal({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <FinanceModal
      title="Profit & planning guidelines"
      description="How figures are calculated and how to use your plan."
      onClose={onClose}
    >
      {financeGuidelineSections(manilaToday()).map((section) => (
        <section key={section.title}>
          <h3 className="font-nunito font-bold text-foreground">{section.title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {section.body}
          </p>
        </section>
      ))}
    </FinanceModal>
  );
}
