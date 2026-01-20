import { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";

import { COLORS } from "../../constants/colors";

interface ScreenWrapperProps {
  children: ReactNode;
  hasInput?: boolean;
  className?: string;
  scrollable?: boolean;
  header?: ReactNode;
  headerBackgroundColor?: string;
  backgroundColor?: string;
}

export default function ScreenWrapper({
  children,
  hasInput = false,
  className = "",
  scrollable,
  header,
  headerBackgroundColor = "bg-primary",
  backgroundColor = COLORS.white
}: ScreenWrapperProps) {
  // Get safe area insets (for notch/dynamic island and status bar)
  const insets = useSafeAreaInsets();
  const useScroll = scrollable ?? hasInput;

  // Calculate keyboard offset for header
  const keyboardOffset = header ? insets.top : 0;

  // Decide if content can be scrollable or static
  const content = useScroll ? (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: insets.bottom + 80
      }}
      className={`${className}`}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  // Wrap with KeyboardAvoidingView if hasInput is true
  const mainContent = hasInput ? (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={"padding"}
      keyboardVerticalOffset={keyboardOffset}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <SafeAreaView 
      className="flex-1"
      style={{
        backgroundColor: backgroundColor
      }}
      edges={header ? ['left', 'right', 'bottom'] : ['left', 'right', 'top']}
    >
      {/* Insert the header if it has */}
      {header && (
        <View
          className={`px-4 pb-4`}
          style={{ 
            paddingTop: insets.top,
            backgroundColor: headerBackgroundColor
          }}
        >
          {header}
        </View>
      )}
      <View
        className={`flex-1 ${!useScroll ? className : ""}`}
      >
        {mainContent}
      </View>
    </SafeAreaView>
  );
}
