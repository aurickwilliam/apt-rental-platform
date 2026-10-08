import { Text, View } from "react-native";

import { BottomSheet, Button } from "heroui-native";

import {
  IconBriefcase,
  IconFileCheck,
  IconId,
  IconShieldCheck,
  IconUserCheck,
  type Icon,
} from "@tabler/icons-react-native";

import { useColors } from "@/hooks/useTheme";

interface Guideline {
  icon: Icon;
  title: string;
  description: string;
}

const GUIDELINES: Guideline[] = [
  {
    icon: IconFileCheck,
    title: "Your APT Passport is submitted automatically",
    description:
      "Your ID and supporting documents are sent with your application, so there is nothing to upload.",
  },
  {
    icon: IconShieldCheck,
    title: "Verified account required",
    description:
      "Only tenants with a verified account can apply. Verify your account first if you haven't.",
  },
  {
    icon: IconId,
    title: "Required documents",
    description:
      "A government ID and proof of billing or residency. Employed and self-employed tenants also need proof of income. NBI clearance is optional.",
  },
  {
    icon: IconBriefcase,
    title: "Keep your documents current",
    description:
      "Expired or rejected documents are not sent. Upload a current copy to your APT Passport before applying.",
  },
  {
    icon: IconUserCheck,
    title: "One application per apartment",
    description:
      "You can have one pending application for each apartment, and you can't apply to your own listing. Please provide accurate information.",
  },
];

interface ApplicationGuidelinesSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Rules for applying, shown when the apply flow opens and on demand. */
export default function ApplicationGuidelinesSheet({
  isOpen,
  onOpenChange,
}: ApplicationGuidelinesSheetProps) {
  const { colors } = useColors();

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          <View className="gap-1 pb-4">
            <Text className="text-foreground text-xl font-nunitoBold">
              Before you apply
            </Text>
            <Text className="text-muted text-sm font-inter">
              A few things to know about applying for this apartment.
            </Text>
          </View>

          <View className="gap-4">
            {GUIDELINES.map(({ icon: GuidelineIcon, title, description }) => (
              <View key={title} className="flex-row gap-3">
                <View className="size-10 rounded-xl bg-primary-light items-center justify-center">
                  <GuidelineIcon size={20} color={colors.primary} />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-foreground text-base font-nunitoSemiBold">
                    {title}
                  </Text>
                  <Text className="text-muted text-sm font-inter leading-snug">
                    {description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <Button
            className="mt-6"
            onPress={() => onOpenChange(false)}
            accessibilityLabel="Close application guidelines"
          >
            <Button.Label>I understand</Button.Label>
          </Button>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
