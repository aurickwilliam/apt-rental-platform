import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function _Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen
            name="onboarding"
            options={{
              title: "Onboarding",
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="sign-in"
            options={{
              title: "Sign In",
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="sign-up"
            options={{
              title: "Sign Up",
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="forgot-password"
            options={{
              title: "Forgot Password",
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="complete-profile"
            options={{
              title: "Complete Profile",
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="verify-mobile"
            options={{
              title: "Verify Email",
              headerShown: false,
            }}
          />

          <Stack.Screen
            name="otp-verification"
            options={{
              title: "OTP Verification",
              headerShown: false,
            }}
          />

        </Stack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
