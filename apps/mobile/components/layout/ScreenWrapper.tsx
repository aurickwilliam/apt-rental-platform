import { ReactNode } from "react";
import {
  View,
  Platform,
  RefreshControl,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { COLORS } from "@repo/constants";

interface ScreenWrapperProps {
  children: ReactNode;
  className?: string;
  backgroundColor?: string;
  header?: ReactNode;
  footer?: ReactNode;
  scrollable?: boolean;
  bottomPadding?: number;
  noTopPadding?: boolean;
  noBottomPadding?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  dismissKeyboardOnTouch?: boolean;
}

// This wraps the content so tapping empty space closes the keyboard
const WrapWithDismiss = ({ children }: { children: ReactNode }) => (
  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    {children}
  </TouchableWithoutFeedback>
);

export default function ScreenWrapper({
  children,
  className = "",
  backgroundColor = COLORS.white,
  header,
  footer,
  scrollable = false,
  bottomPadding = 0,
  noTopPadding = false,
  noBottomPadding = false,
  refreshing = false,
  onRefresh,
  dismissKeyboardOnTouch = true,
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();

  const paddingTop = noTopPadding ? 0 : header ? 0 : insets.top;

  return (
    <View style={{ flex: 1, backgroundColor }}>
      {header && header}

      {scrollable ? (
        <KeyboardAwareScrollView
          extraHeight={Platform.OS === 'ios' ? 50 : 100}
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          extraScrollHeight={Platform.OS === "ios" ? 50 : 80}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.primary}
                colors={[COLORS.primary]}
              />
            ) : undefined
          }

          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: paddingTop,
            paddingBottom: footer || noBottomPadding ? bottomPadding : bottomPadding + insets.bottom,
          }}
        >
          {dismissKeyboardOnTouch ? (
            <WrapWithDismiss>
              <View className={`flex-1 relative ${className}`}>
                {children}
              </View>
            </WrapWithDismiss>
          ) : (
            <View className={`flex-1 relative ${className}`}>
              {children}
            </View>
          )}
        </KeyboardAwareScrollView>
      ) : (
        dismissKeyboardOnTouch ? (
        <WrapWithDismiss>
          <View
            style={{
              flex: 1,
              paddingTop: paddingTop,
              paddingBottom: footer || noBottomPadding ? bottomPadding : bottomPadding + insets.bottom,
            }}
          >
            <View className={`flex-1 relative ${className}`}>
              {children}
            </View>
          </View>
        </WrapWithDismiss>
        ) : (
          <View
            style={{
              flex: 1,
              paddingTop: paddingTop,
              paddingBottom: footer || noBottomPadding ? bottomPadding : bottomPadding + insets.bottom,
            }}
          >
            <View className={`flex-1 relative ${className}`}>
              {children}
            </View>
          </View>
        )
      )}

      {footer && (
        <View style={{ paddingBottom: insets.bottom }}>
          {footer}
        </View>
      )}
    </View>
  );
}
