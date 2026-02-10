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
         <Stack.Screen name="index"/>
        </Stack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  )
}