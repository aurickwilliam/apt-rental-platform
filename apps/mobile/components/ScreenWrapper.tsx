import { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  View,
} from "react-native";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";

interface ScreenWrapperProps {
  children: ReactNode;
  hasInput?: boolean;
  className?: string;
  scrollable?: boolean;
  backgroundColor?: string;
  header?: ReactNode;
  headerBackgroundColor?: string;
}

export default function ScreenWrapper({ 
    children,
    hasInput = false,
    className = "",
    scrollable,
    backgroundColor = "bg-white",
    header,
    headerBackgroundColor = "bg-primary",
  }: ScreenWrapperProps) {
  
  // Get safe area insets (for notch/dynamic island and status bar)
  const insets = useSafeAreaInsets();
  const useScroll = scrollable ?? hasInput;

  // Decide if content can be scrollable or static
  const content = useScroll ? (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      className={`p-5 ${className}`}
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
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <View className={`flex-1 ${backgroundColor}`}>

      {/* Insert the header if it has */}
      {header && (
        <View 
          className={`px-4 pb-4 ${headerBackgroundColor}`}
          style={{ paddingTop: insets.top }}
        >
          {header}
        </View>
      )}

      <SafeAreaView 
        className="flex-1"
        edges={header ? ['left', 'right', 'bottom'] : undefined}
      >
        {mainContent}
      </SafeAreaView>

    </View>
  );
}