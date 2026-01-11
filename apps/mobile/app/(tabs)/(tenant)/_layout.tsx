import { TabBar } from '../../../components/TabBar'
import { Tabs } from 'expo-router'

export default function TenantTabLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} userType="tenant"/>}>
      <Tabs.Screen name='home' options={{title: "Home"}}/>
      <Tabs.Screen name='search' options={{title: "Search"}}/>
      <Tabs.Screen name='rentals' options={{title: "Rentals"}}/>
      <Tabs.Screen name='chat' options={{title: "Chat"}}/>
      <Tabs.Screen name='profile' options={{title: "Profile"}}/>
    </Tabs>
  )
}
