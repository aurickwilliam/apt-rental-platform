import { ReactNode, forwardRef } from "react";
import {
  View,
  RefreshControl,
  TouchableWithoutFeedback,
  Keyboard,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewRef,
} from "react-native-keyboard-controller";

import { Spinner } from "heroui-native";

import { useColors } from "hooks/useTheme";

// Space kept between the focused input and the top of the keyboard.
const KEYBOARD_BOTTOM_OFFSET = 50;

// Ref to a scrollable ScreenWrapper: a ScrollView (scrollTo, scrollToEnd, ...).
// Screens import this instead of the keyboard library.
export type ScreenWrapperScrollRef = KeyboardAwareScrollViewRef;

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
  onRefresh?: () => void | Promise<void>;
  dismissKeyboardOnTouch?: boolean;
  // Scrollable only: scroll position updates (throttled to ~60fps).
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

const WrapWithDismiss = ({ children }: { children: ReactNode }) => (
  <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    {children}
  </TouchableWithoutFeedback>
);

const ScreenWrapper = forwardRef<ScreenWrapperScrollRef, ScreenWrapperProps>(
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
      onScroll,
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
            bottomOffset={KEYBOARD_BOTTOM_OFFSET}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={onScroll ? 16 : undefined}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="transparent"
                  colors={["transparent"]}
                  progressBackgroundColor="transparent"
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
            {refreshing && (
              <View className="items-center py-3">
                <Spinner size="lg" color={colors.primary} accessibilityLabel="Refreshing" />
              </View>
            )}
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
