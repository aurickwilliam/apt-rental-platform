import { ReactNode } from "react";
import {
  View,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { COLORS } from "../../constants/colors";

interface ScreenWrapperProps {
  children: ReactNode;
  className?: string;
  backgroundColor?: string;
  header?: ReactNode;
  footer?: ReactNode;
  scrollable?: boolean;
  bottomPadding?: number;
}

export default function ScreenWrapper({
  children,
  className = "",
  backgroundColor = COLORS.white,
  header,
  footer,
  scrollable = false,
  bottomPadding = 0,
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();

  const paddingTop = header ? 0 : insets.top;

  // This wraps the content so tapping empty space closes the keyboard
  const WrapWithDismiss = ({ children }: { children: ReactNode }) => (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {children}
    </TouchableWithoutFeedback>
  );

  return (
    <View style={{ flex: 1, backgroundColor }}>
      {header && (
        <View style={{ paddingTop: insets.top }}>
          {header}
        </View>
      )}

      {scrollable ? (
        <KeyboardAwareScrollView
          extraHeight={Platform.OS === 'ios' ? 50 : 100}
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          extraScrollHeight={Platform.OS === "ios" ? 50 : 80}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}

          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: paddingTop,
            paddingBottom: footer ? 0 : bottomPadding + (insets.bottom || 20),
          }}
        >
          <WrapWithDismiss>
            <View className={`flex-1 relative ${className}`}>
              {children}
            </View>
          </WrapWithDismiss>
        </KeyboardAwareScrollView>
      ) : (
        <WrapWithDismiss>
          <View
            style={{
              flex: 1,
              paddingTop: paddingTop,
              paddingBottom: insets.bottom,
            }}
          >
            <View className={`flex-1 relative ${className}`}>
              {children}
            </View>
          </View>
        </WrapWithDismiss>
      )}

      {footer && (
        <View style={{ paddingBottom: insets.bottom }}>
          {footer}
        </View>
      )}
    </View>
  );
}
