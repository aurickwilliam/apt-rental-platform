import { Stack } from "expo-router"
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

export default function _layout() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <BottomSheetModalProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="apartment-summary" />
          <Stack.Screen name="review-information" />
          <Stack.Screen name="submitted" />
          <Stack.Screen name="first-process" />
          <Stack.Screen name="second-process" />
          <Stack.Screen name="third-process" />
        </Stack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  )
}