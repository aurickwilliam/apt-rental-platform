import { ReactNode, forwardRef } from "react";
import {
  View,
  Platform,
  RefreshControl,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { useColors } from "hooks/useTheme";

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

const WrapWithDismiss = ({ children }: { children: ReactNode }) => (
  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    {children}
  </TouchableWithoutFeedback>
);

const ScreenWrapper = forwardRef<KeyboardAwareScrollView, ScreenWrapperProps>(
  function ScreenWrapper(
    {
      children,
      className = "",
      backgroundColor,
      header,
      footer,
      scrollable = false,
      bottomPadding = 0,
      noTopPadding = false,
      noBottomPadding = false,
      refreshing = false,
      onRefresh,
      dismissKeyboardOnTouch = true,
    },
    ref,
  ) {
    const insets = useSafeAreaInsets();
    const { colors } = useColors();

    const containerStyle = backgroundColor
      ? { flex: 1, backgroundColor }
      : { flex: 1 };
    const containerClassName = backgroundColor ? "" : "bg-background";

    const paddingTop = noTopPadding ? 0 : header ? 0 : insets.top;

    return (
      <View style={containerStyle} className={containerClassName}>
        {header && header}

        {scrollable ? (
          <KeyboardAwareScrollView
            ref={ref}
            extraHeight={Platform.OS === "ios" ? 50 : 100}
            enableOnAndroid={true}
            enableAutomaticScroll={true}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.primary}
                  colors={[colors.primary]}
                />
              ) : undefined
            }
            contentContainerStyle={{
              flexGrow: 1,
              paddingTop: paddingTop,
              paddingBottom:
                footer || noBottomPadding
                  ? bottomPadding
                  : bottomPadding + insets.bottom,
            }}
          >
            {dismissKeyboardOnTouch ? (
              <WrapWithDismiss>
                <View className={`flex-1 relative ${className}`}>
                  {children}
                </View>
              </WrapWithDismiss>
            ) : (
              <View className={`flex-1 relative ${className}`}>{children}</View>
            )}
          </KeyboardAwareScrollView>
        ) : dismissKeyboardOnTouch ? (
          <WrapWithDismiss>
            <View
              style={{
                flex: 1,
                paddingTop: paddingTop,
                paddingBottom:
                  footer || noBottomPadding
                    ? bottomPadding
                    : bottomPadding + insets.bottom,
              }}
            >
              <View className={`flex-1 relative ${className}`}>{children}</View>
            </View>
          </WrapWithDismiss>
        ) : (
          <View
            style={{
              flex: 1,
              paddingTop: paddingTop,
              paddingBottom:
                footer || noBottomPadding
                  ? bottomPadding
                  : bottomPadding + insets.bottom,
            }}
          >
            <View className={`flex-1 relative ${className}`}>{children}</View>
          </View>
        )}

        {footer && (
          <View style={{ paddingBottom: insets.bottom }}>{footer}</View>
        )}
      </View>
    );
  },
);

export default ScreenWrapper;