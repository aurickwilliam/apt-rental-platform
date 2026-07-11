import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import {
  IconBed,
  IconSearch,
  IconMessageCircle,
  IconUser,
  IconBedFilled,
  IconUserFilled
} from "@tabler/icons-react-native";

import { useColors } from "hooks/useTheme";

import { CustomTabBar, type CustomTabConfig } from '../components/CustomTabBar';

const TENANT_TABS: CustomTabConfig[] = [
  {
    name: 'rentals',
    label: 'Rentals',
    icon: IconBed,
    iconFilled: IconBedFilled
  },
  {
    name: 'search',
    label: 'Search',
    icon: IconSearch,
    iconFilled: IconSearch
  },
  {
    name: 'chat',
    label: 'Chat',
    icon: IconMessageCircle,
    iconFilled: IconMessageCircle
  },
  {
    name: 'profile',
    label: 'Profile',
    icon: IconUser,
    iconFilled: IconUserFilled
  },
];

export default function TenantTabLayout() {
  const { colors } = useColors();

  if (Platform.OS === 'android') {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0
          },
        }}
        tabBar={(props) => <CustomTabBar {...props} tabs={TENANT_TABS} />}
      >
        {TENANT_TABS.map((tab) => (
          <Tabs.Screen key={tab.name} name={tab.name} />
        ))}
      </Tabs>
    );
  }

  return (
    <NativeTabs
      tintColor={colors.primary}
      labelStyle={{ color: colors.primary }}
    >
      <NativeTabs.Trigger name="rentals">
        <NativeTabs.Trigger.Label>Rentals</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "bed.double", selected: "bed.double.fill" }}
          md="bed"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search">
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "magnifyingglass", selected: "magnifyingglass" }}
          md="search"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="chat">
        <NativeTabs.Trigger.Label>Chat</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "message", selected: "message.fill" }}
          md="chat_bubble"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "person", selected: "person.fill" }}
          md="person"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
