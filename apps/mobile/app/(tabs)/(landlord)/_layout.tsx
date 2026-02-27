import { TabBar } from 'components/layout/TabBar'
import { Tabs } from 'expo-router'

export default function LandlordTabLayout() {
  return (
    <Tabs 
      tabBar={(props) => <TabBar {...props} userType="landlord"/>}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name='dashboard' options={{title: "Dashboard"}}/>
      <Tabs.Screen name='units' options={{title: "Units"}}/>
      <Tabs.Screen name='chat' options={{title: "Chat"}}/>
      <Tabs.Screen name='profile' options={{title: "Profile"}}/>
    </Tabs>
  )
}
