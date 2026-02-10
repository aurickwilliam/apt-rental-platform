import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Stack } from "expo-router"

export default function _layout() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <BottomSheetModalProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="current-apartment"/>
          <Stack.Screen name="edit-profile"/>
          <Stack.Screen name="current-lease"/>
          <Stack.Screen name="favorites"/>
        </Stack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  )
}