import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Tabs } from 'expo-router';
import { useMemo } from 'react';
import { Platform } from 'react-native';

import {
  IconBed,
  IconSearch,
  IconMessageCircle,
  IconMessageCircleFilled,
  IconUser,
  IconBedFilled,
  IconUserFilled
} from "@tabler/icons-react-native";

import { useColors } from "hooks/useTheme";

import { CustomTabBar, type CustomTabConfig } from '@/components/layout/CustomTabBar';
import { TabBarVisibilityProvider } from '@/components/layout/TabBarVisibilityContext';
import { useUnreadChatCount } from '@/hooks/chat';

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
    iconFilled: IconMessageCircleFilled
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
  // Owns the tenant chat list's realtime channel (the Chat screen reads it with subscribe: false).
  const unreadChats = useUnreadChatCount('tenant');

  const tabs = useMemo(
    () =>
      TENANT_TABS.map((tab) =>
        tab.name === 'chat' ? { ...tab, badge: unreadChats } : tab
      ),
    [unreadChats]
  );

  if (Platform.OS === 'android') {
    return (
      <TabBarVisibilityProvider>
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
          tabBar={(props) => <CustomTabBar {...props} tabs={tabs} />}
        >
          {TENANT_TABS.map((tab) => (
            <Tabs.Screen key={tab.name} name={tab.name} />
          ))}
        </Tabs>
      </TabBarVisibilityProvider>
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
