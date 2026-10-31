import { Text, View } from "react-native";
import type { LegalBlock, LegalSection } from "@/constants/legal/types";

interface LegalPolicySectionProps {
  section: LegalSection;
  number: number;
}

export default function LegalPolicySection({ section, number }: LegalPolicySectionProps) {
  const blocks: LegalBlock[] = section.blocks ?? [
    ...(section.intro ? [{ type: "paragraph" as const, text: section.intro }] : []),
    ...(section.list ? [{ type: "list" as const, items: section.list }] : []),
    ...(section.body ?? []).map((text) => ({ type: "paragraph" as const, text })),
  ];

  return (
    <View className="gap-2 border-b border-border pb-4">
      <Text selectable accessibilityRole="header" className="text-sm font-nunitoSemiBold text-foreground">
        {number}. {section.title}
      </Text>
      {blocks.map((block, index) => block.type === "list" ? (
        <View key={index} className="gap-1 pl-2">
          {block.items.map((item) => (
            <Text selectable key={item} className="text-sm text-muted leading-6">
              • {item}
            </Text>
          ))}
        </View>
      ) : (
        <Text
          selectable
          key={index}
          accessibilityRole={block.type === "subheading" ? "header" : undefined}
          className={block.type === "subheading"
            ? "text-sm font-nunitoSemiBold text-foreground mt-2"
            : "text-sm text-muted leading-6"}
        >
          {block.text}
        </Text>
      ))}
      {section.callout ? (
        <View className={section.callout.kind === "warning"
          ? "gap-1 rounded-lg bg-warning-light p-3"
          : "gap-1 rounded-lg bg-surface-secondary p-3"}>
          <Text selectable className={section.callout.kind === "warning"
            ? "text-sm font-nunitoSemiBold text-warning-text"
            : "text-sm font-nunitoSemiBold text-foreground"}>
            {section.callout.label}
          </Text>
          <Text selectable className="text-sm text-foreground leading-6">
            {section.callout.text}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
