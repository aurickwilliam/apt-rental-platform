import { Stack } from "expo-router"
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

export default function ApartmentLayout() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <BottomSheetModalProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="ratings"/>
          <Stack.Screen name="rate-apartment"/>
          <Stack.Screen name="map-view"/>
          <Stack.Screen name="included-perks"/>
          <Stack.Screen name="request-visit"/>
          <Stack.Screen name="view-lease"/>
        </Stack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  )
}