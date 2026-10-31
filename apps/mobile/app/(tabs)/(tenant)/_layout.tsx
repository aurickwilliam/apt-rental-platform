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

import { useTranslation } from "hooks/i18n";
import { useColors } from "hooks/useTheme";

import { CustomTabBar, type CustomTabConfig } from '@/components/layout/CustomTabBar';

const TENANT_TABS: CustomTabConfig[] = [
  {
    name: 'rentals',
    labelKey: 'nav.rentals',
    icon: IconBed,
    iconFilled: IconBedFilled
  },
  {
    name: 'search',
    labelKey: 'nav.search',
    icon: IconSearch,
    iconFilled: IconSearch
  },
  {
    name: 'chat',
    labelKey: 'nav.chat',
    icon: IconMessageCircle,
    iconFilled: IconMessageCircle
  },
  {
    name: 'profile',
    labelKey: 'nav.profile',
    icon: IconUser,
    iconFilled: IconUserFilled
  },
];

export default function TenantTabLayout() {
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
        <NativeTabs.Trigger.Label>{t("nav.rentals")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "bed.double", selected: "bed.double.fill" }}
          md="bed"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search">
        <NativeTabs.Trigger.Label>{t("nav.search")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "magnifyingglass", selected: "magnifyingglass" }}
          md="search"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="chat">
        <NativeTabs.Trigger.Label>{t("nav.chat")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "message", selected: "message.fill" }}
          md="chat_bubble"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>{t("nav.profile")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "person", selected: "person.fill" }}
          md="person"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
