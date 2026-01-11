import { Tabs } from 'expo-router'

export default function _layout() {
  return (
    <Tabs>
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="apartment" />
      <Tabs.Screen name="message" />
      <Tabs.Screen name="profile" />
    </Tabs>
  )
}