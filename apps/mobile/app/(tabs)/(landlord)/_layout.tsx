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

import { useTranslation } from 'hooks/i18n';
import { useColors } from 'hooks/useTheme';

import { CustomTabBar, type CustomTabConfig } from '@/components/layout/CustomTabBar';

const LANDLORD_TABS: CustomTabConfig[] = [
  {
    name: 'dashboard',
    labelKey: 'nav.dashboard',
    icon: IconLayoutGrid,
    iconFilled: IconLayoutGridFilled,
  },
  {
    name: 'units',
    labelKey: 'nav.units',
    icon: IconBuilding,
    iconFilled: IconBuilding,
  },
  {
    name: 'chat',
    labelKey: 'nav.chat',
    icon: IconMessageCircle,
    iconFilled: IconMessageCircleFilled,
  },
  {
    name: 'profile',
    labelKey: 'nav.profile',
    icon: IconUser,
    iconFilled: IconUserFilled,
  },
];

export default function LandlordTabLayout() {
  const { colors } = useColors();
  const { t } = useTranslation();

  if (Platform.OS === 'android') {
    return (
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
        tabBar={(props) => <CustomTabBar {...props} tabs={LANDLORD_TABS} />}
      >
        {LANDLORD_TABS.map((tab) => (
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
      <NativeTabs.Trigger name="dashboard">
        <NativeTabs.Trigger.Label>{t("nav.dashboard")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }}
          md="dashboard"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="units">
        <NativeTabs.Trigger.Label>{t("nav.units")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'building.2', selected: 'building.2.fill' }}
          md="apartment"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="chat">
        <NativeTabs.Trigger.Label>{t("nav.chat")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'message', selected: 'message.fill' }}
          md="chat_bubble"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>{t("nav.profile")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person', selected: 'person.fill' }}
          md="person"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
