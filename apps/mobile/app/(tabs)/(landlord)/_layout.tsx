import { useMemo } from 'react';
import { Platform } from 'react-native';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Tabs } from 'expo-router';
import {
  IconLayoutGrid,
  IconLayoutGridFilled,
  IconBuilding,
  IconMessageCircle,
  IconMessageCircleFilled,
  IconUser,
  IconUserFilled,
} from '@tabler/icons-react-native';

import { useColors } from 'hooks/useTheme';

import { CustomTabBar, type CustomTabConfig } from '@/components/layout/CustomTabBar';
import { TabBarVisibilityProvider } from '@/components/layout/TabBarVisibilityContext';
import { useLandlordActionBadges } from '@/hooks/apartments';
import { useUnreadChatCount } from '@/hooks/chat';

const LANDLORD_TABS: CustomTabConfig[] = [
  {
    name: 'dashboard',
    label: 'Dashboard',
    icon: IconLayoutGrid,
    iconFilled: IconLayoutGridFilled,
  },
  {
    name: 'units',
    label: 'Units',
    icon: IconBuilding,
    iconFilled: IconBuilding,
  },
  {
    name: 'chat',
    label: 'Chat',
    icon: IconMessageCircle,
    iconFilled: IconMessageCircleFilled,
  },
  {
    name: 'profile',
    label: 'Profile',
    icon: IconUser,
    iconFilled: IconUserFilled,
  },
];

export default function LandlordTabLayout() {
  const { colors } = useColors();
  // Owns the landlord chat list's realtime channel (the Chat screen reads it with subscribe: false).
  const unreadChats = useUnreadChatCount('landlord');
  const { counts } = useLandlordActionBadges();
  const pendingUnitActions = counts.maintenance + counts.visits + counts.applications;

  const tabs = useMemo(
    () =>
      LANDLORD_TABS.map((tab) => {
        if (tab.name === 'chat') return { ...tab, badge: unreadChats };
        if (tab.name === 'units') return { ...tab, badge: pendingUnitActions };
        return tab;
      }),
    [unreadChats, pendingUnitActions]
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
              elevation: 0,
            },
          }}
          tabBar={(props) => <CustomTabBar {...props} tabs={tabs} />}
        >
          {LANDLORD_TABS.map((tab) => (
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
      <NativeTabs.Trigger name="dashboard">
        <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }}
          md="dashboard"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="units">
        <NativeTabs.Trigger.Label>Units</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'building.2', selected: 'building.2.fill' }}
          md="apartment"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="chat">
        <NativeTabs.Trigger.Label>Chat</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'message', selected: 'message.fill' }}
          md="chat_bubble"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person', selected: 'person.fill' }}
          md="person"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
