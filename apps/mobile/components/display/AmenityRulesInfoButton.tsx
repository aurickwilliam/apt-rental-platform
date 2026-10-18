import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { IconInfoCircle } from "@tabler/icons-react-native";
import { Button } from "heroui-native";

import { getConflictingAmenities } from "@repo/constants";
import { PERKS } from "constants/perks";
import AppDialog from "@/components/display/AppDialog";

interface AmenityRulesInfoButtonProps {
  /** Icon color; the perk screens use a white header. */
  color?: string;
}

const nameOf = (id: string) => PERKS[id]?.name ?? id;

// One line per perk that blocks others, e.g. "No Cooking Allowed: Kitchen, Stove…".
const RULE_LINES = ["no_cooking", "smoking"].map((id) => ({
  id,
  name: nameOf(id),
  blocks: getConflictingAmenities(id).map(nameOf).join(", "),
}));

/** Info icon for a perk picker header that explains which perks can't be combined. */
export default function AmenityRulesInfoButton({ color = "white" }: AmenityRulesInfoButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setIsOpen(true)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Perks that can't go together"
        className="p-1 -mr-1"
      >
        <IconInfoCircle size={24} color={color} />
      </TouchableOpacity>

      <AppDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        title="Perks that can't go together"
        description="Picking one of these removes the others."
        footer={
          <Button size="sm" onPress={() => setIsOpen(false)}>
            <Button.Label>Got it</Button.Label>
          </Button>
        }
      >
        <View className="gap-3">
          {RULE_LINES.map((rule) => (
            <Text key={rule.id} className="text-foreground text-sm font-inter">
              <Text className="font-nunitoBold">{rule.name}</Text>
              {" can't be combined with "}
              {rule.blocks}.
            </Text>
          ))}
        </View>
      </AppDialog>
    </>
  );
}
