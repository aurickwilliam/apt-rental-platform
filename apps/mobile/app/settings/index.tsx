import { View, Text } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'

import { ListGroup, Separator, Switch, Chip } from 'heroui-native'

import { IconKey, IconMail, IconGlobe, IconBell, IconMoonStars, IconAlertCircle, IconHelpCircle, IconFileText, IconShieldCheck, IconUsersGroup, IconChevronRight, IconAdjustments } from '@tabler/icons-react-native';
import type { Icon } from '@tabler/icons-react-native';

import { useTheme } from '@/hooks/useTheme'
import { useNotificationPreferences } from '@/hooks/notifications'
import { useUserPreferences } from '@/hooks/preferences/useUserPreferences'

type SettingItem = {
  icon: Icon
  title: string
  onPress?: () => void
  disabled?: boolean
  suffix?: React.ReactNode
  iconColor?: string
}

type SettingSection = {
  title: string
  items: SettingItem[]
}

function ComingSoonChip() {
  return (
    <Chip size="sm" variant="soft" color="default" animation="disable-all" className="px-2">
      <Chip.Label className="text-[11px] font-nunitoSemiBold text-muted">Coming soon</Chip.Label>
    </Chip>
  );
}

export default function Index() {
  const router = useRouter()
  const { colors, isDark, toggleTheme } = useTheme();

  const { preferences: notifPrefs } = useNotificationPreferences();
  const { preferences: rentalPrefs, hasPrefs } = useUserPreferences();

  // Both masters on → "On", both off → "Off", mixed → "Partial".
  const notificationSummary =
    notifPrefs.notifications_enabled && notifPrefs.push_enabled
      ? 'On'
      : !notifPrefs.notifications_enabled && !notifPrefs.push_enabled
        ? 'Off'
        : 'Partial';

  const rentalSummary = (() => {
    if (!rentalPrefs || !hasPrefs) return "Not set";
    const cities = rentalPrefs.selectedCities;
    const cityPart = cities.length > 0 ? cities.slice(0, 2).join(", ") + (cities.length > 2 ? ` +${cities.length - 2}` : "") : "CAMANAVA";
    return `${cityPart} · ₱${rentalPrefs.budgetMin.toLocaleString()}–${rentalPrefs.budgetMax.toLocaleString()}`;
  })();

  const sections: SettingSection[] = [
    {
      title: 'Security',
      items: [
        {
          icon: IconKey,
          title: 'Change Password',
          disabled: true,
          suffix: <ComingSoonChip />,
        },
        {
          icon: IconMail,
          title: 'Change Email',
          disabled: true,
          suffix: <ComingSoonChip />,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: IconAdjustments,
          title: 'Rental Preferences',
          onPress: () => router.push('/settings/preferences'),
          suffix: (
            <View className="flex-row items-center gap-1 max-w-[160px]">
              <Text className="text-muted text-xs font-inter flex-shrink" numberOfLines={1}>
                {rentalSummary}
              </Text>
              <IconChevronRight size={16} color={colors.gray500} />
            </View>
          ),
        },
        {
          icon: IconGlobe,
          title: 'Language & Region',
          disabled: true,
          suffix: <ComingSoonChip />,
        },
        {
          icon: IconBell,
          title: 'Notifications',
          onPress: () => router.push('/settings/notifications'),
          suffix: (
            <View className="flex-row items-center gap-1">
              <Text className='text-muted text-sm font-inter'>
                {notificationSummary}
              </Text>
              <IconChevronRight size={16} color={colors.gray500} />
            </View>
          ),
        },
        {
          icon: IconMoonStars,
          title: 'Dark Mode',
          disabled: true,
          suffix: (
            <Switch
              isSelected={isDark}
              onSelectedChange={toggleTheme}
            />
          ),
        },
      ],
    },
    {
      title: 'Help & Support',
      items: [
        {
          icon: IconAlertCircle,
          title: 'Report a Problem',
          disabled: true,
          suffix: <ComingSoonChip />,
        },
        {
          icon: IconHelpCircle,
          title: 'FAQs',
          onPress: () => router.push('/settings/faq'),
        },
        {
          icon: IconFileText,
          title: 'Terms and Conditions',
          onPress: () => router.push('/settings/terms'),
        },
        {
          icon: IconShieldCheck,
          title: 'Privacy Policy',
          onPress: () => router.push('/settings/privacy-policy'),
        },
        {
          icon: IconUsersGroup,
          title: 'About Us',
          onPress: () => router.push('/settings/about'),
        }
      ],
    },
  ]

  return (
    <ScreenWrapper
      scrollable
      bottomPadding={50}
      header={<StandardHeader title='Settings' />}
      className='p-5'
    >
      {sections.map((section, sIndex) => (
        <View key={section.title} className={`flex gap-3 ${sIndex > 0 ? 'mt-5' : ''}`}>
          <Text className='text-foreground text-base font-nunitoSemiBold'>
            {section.title}
          </Text>

          <ListGroup className="shadow-none border border-border">
            {section.items.map((item, iIndex) => (
              <View key={item.title}>
                {iIndex > 0 && <Separator className='mx-4' />}

                <ListGroup.Item onPress={item.onPress} disabled={item.disabled}>
                  <ListGroup.ItemPrefix>
                    <item.icon size={20} color={item.iconColor ?? colors.textPrimary} />
                  </ListGroup.ItemPrefix>

                  <ListGroup.ItemContent>
                    <ListGroup.ItemTitle>
                      {item.title}
                    </ListGroup.ItemTitle>
                  </ListGroup.ItemContent>

                  <ListGroup.ItemSuffix>
                    {item.suffix}
                  </ListGroup.ItemSuffix>
                </ListGroup.Item>
              </View>
            ))}
          </ListGroup>
        </View>
      ))}
    </ScreenWrapper>
  )
}