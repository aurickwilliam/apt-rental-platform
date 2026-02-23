import { Tabs } from 'expo-router'

import { TabBar } from 'components/layout/TabBar'

export default function TenantTabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} userType="tenant" />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name='home' options={{ title: "Home" }} />
      <Tabs.Screen name='search' options={{title: "Search"}}/>
      <Tabs.Screen name='rentals' options={{title: "Rentals"}}/>
      <Tabs.Screen name='chat' options={{title: "Chat"}}/>
      <Tabs.Screen name='profile' options={{title: "Profile"}}/>
    </Tabs>
  )
}
