import { Text, View, useWindowDimensions } from "react-native";
import { Button } from "heroui-native";
import { IconHomeFilled, IconPencil, IconStarFilled } from "@tabler/icons-react-native";
import AppDialog from "@/components/display/AppDialog";
import { useColors } from "@/hooks/useTheme";

interface ReviewUnlockDialogProps {
  isOpen: boolean;
  apartmentName: string;
  onDismiss: () => void;
  onReview: () => void;
}

export default function ReviewUnlockDialog({ isOpen, apartmentName, onDismiss, onReview }: ReviewUnlockDialogProps) {
  const { colors } = useColors();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  return (
    <AppDialog
      isOpen={isOpen}
      onOpenChange={open => { if (!open) onDismiss(); }}
      title={`You can now review\n${apartmentName.trim()}!`}
      titleLayout="centered"
      titleIllustration={
        <View
          testID="review-unlock-illustration"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="relative size-28 items-center justify-center rounded-full bg-primary-light"
        >
          <IconHomeFilled size={52} color={colors.primary} />
          <IconStarFilled size={16} color={colors.rating} style={{ position: "absolute", right: -4, top: 8 }} />
          <IconStarFilled size={12} color={colors.rating} style={{ position: "absolute", left: -4, top: 24 }} />
          <IconStarFilled size={10} color={colors.rating} style={{ position: "absolute", bottom: -4, right: 12 }} />
        </View>
      }
      scrollable
      fitToViewport
      footer={
        <View className="gap-2" style={{ flexDirection: landscape ? "row" : "column" }}>
          <Button onPress={onReview} className="min-h-12" style={landscape ? { flex: 1 } : undefined}>
            <IconPencil size={18} color={colors.secondaryForeground} />
            <Button.Label>Write a Review</Button.Label>
          </Button>
          <Button variant="secondary" onPress={onDismiss} className="min-h-12" style={landscape ? { flex: 1 } : undefined}>
            <Button.Label>Maybe later</Button.Label>
          </Button>
        </View>
      }
    >
      <View className="items-center gap-4">
        <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="flex-row gap-1">
          {[1, 2, 3, 4, 5].map(star => <IconStarFilled key={star} size={24} color={colors.rating} />)}
        </View>
        <Text className="text-center font-inter text-sm leading-5 text-muted">
          Thanks for staying with us — your experience can help other tenants find their place to thrive.
        </Text>
      </View>
    </AppDialog>
  );
}
