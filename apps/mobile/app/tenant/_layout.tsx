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
          <Stack.Screen name="current-apartment"/>
          <Stack.Screen name="edit-profile"/>
          <Stack.Screen name="current-lease"/>
          <Stack.Screen name="favorites"/>
          <Stack.Screen name="settings"/>
        </Stack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  )
}