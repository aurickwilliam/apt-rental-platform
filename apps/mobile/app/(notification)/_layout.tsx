import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { Stack } from 'expo-router'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

export default function NotificationLayout() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <BottomSheetModalProvider>
        <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen 
          name='tenant-notif'
        />
        <Stack.Screen 
          name='landlord-notif'
        />
      </Stack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
    
  )
}