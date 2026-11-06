import { useCallback, useRef, useState } from "react";
import { AccessibilityInfo, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, useThemeColor } from "heroui-native";
import { IconArrowUp } from "@tabler/icons-react-native";
import StandardHeader from "@/components/layout/StandardHeader";
import ScreenWrapper, { type ScreenWrapperScrollRef } from "@/components/layout/ScreenWrapper";
import type { LegalPolicy } from "@/constants/legal/types";
import LegalPolicyContent from "./LegalPolicyContent";

interface LegalPolicyScreenProps {
  policy: LegalPolicy;
}

const BACK_TO_TOP_GAP = 16;
const BACK_TO_TOP_HEIGHT = 44;
const BACK_TO_TOP_CONTENT_CLEARANCE = BACK_TO_TOP_HEIGHT + BACK_TO_TOP_GAP * 2;

export default function LegalPolicyScreen({ policy }: LegalPolicyScreenProps) {
  const scrollRef = useRef<ScreenWrapperScrollRef>(null);
  const insets = useSafeAreaInsets();
  const foreground = useThemeColor("foreground");
  const [isScrolled, setIsScrolled] = useState(false);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIsScrolled(event.nativeEvent.contentOffset.y > 0);
  }, []);

  const scrollToTop = async () => {
    let animated = false;
    try {
      animated = !(await AccessibilityInfo.isReduceMotionEnabled());
    } catch (error) {
      console.warn("Unable to read motion preference; scrolling without animation.", error);
    }
    // ScreenWrapper clears its ref on unmount, so a late preference response
    // cannot scroll a different screen after the reader has been closed.
    scrollRef.current?.scrollTo({ x: 0, y: 0, animated });
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenWrapper
        ref={scrollRef}
        header={<StandardHeader title={policy.title} />}
        scrollable
        className="p-5"
        onScroll={handleScroll}
        bottomPadding={BACK_TO_TOP_CONTENT_CLEARANCE}
      >
        <LegalPolicyContent policy={policy} />
      </ScreenWrapper>
      {isScrolled ? (
        <View
          testID="policy-back-to-top"
          className="absolute"
          style={{ bottom: insets.bottom + BACK_TO_TOP_GAP, right: insets.right + BACK_TO_TOP_GAP }}
        >
          <Button
            variant="outline"
            className="min-h-11 rounded-full bg-surface px-4"
            accessibilityLabel="Back to top"
            accessibilityHint="Scroll to the beginning of this policy."
            onPress={scrollToTop}
          >
            <IconArrowUp size={18} color={foreground} accessible={false} />
            <Button.Label>Back to top</Button.Label>
          </Button>
        </View>
      ) : null}
    </View>
  );
}
