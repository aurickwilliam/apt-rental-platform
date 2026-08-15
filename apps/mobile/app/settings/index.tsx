import { View, Text } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'

import { ListGroup, Separator, Switch } from 'heroui-native'

import {
  LucideIcon,
  KeyRound,
  Mail,
  Globe,
  Bell,
  MoonStar,
  CircleAlert,
  CircleQuestionMark,
  FileText,
  ShieldCheck,
  UsersRound,
} from 'lucide-react-native';
import type { Icon } from '@tabler/icons-react-native';

import { useTheme } from '@/hooks/useTheme'
import { useNotificationPreferences, useNotificationTypeColor, getNotificationTypeIcon } from '@/hooks/notifications'
import type { NotificationPreferenceType } from '@/service/notificationService'

type SettingItem = {
  icon: LucideIcon | Icon
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

const NOTIFICATION_TYPE_LABELS: { type: NotificationPreferenceType; label: string }[] = [
  { type: 'payment', label: 'Payments' },
  { type: 'message', label: 'Messages' },
  { type: 'maintenance', label: 'Maintenance' },
  { type: 'apartment', label: 'Apartments' },
  { type: 'system', label: 'System' },
]

export default function Index() {
  const router = useRouter()
  const { colors, isDark, toggleTheme } = useTheme();

  const { preferences, setPreferences } = useNotificationPreferences();
  const { getColor } = useNotificationTypeColor();

  const toggleMaster = () => {
    setPreferences((prev) => ({
      ...prev,
      notifications_enabled: !prev.notifications_enabled,
    }));
  };

  const toggleType = (type: NotificationPreferenceType) => {
    setPreferences((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const sections: SettingSection[] = [
    {
      title: 'Security',
      items: [
        {
          icon: KeyRound,
          title: 'Change Password',
          onPress: () => {},
        },
        {
          icon: Mail,
          title: 'Change Email',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: Globe,
          title: 'Language & Region',
          onPress: () => router.push('/settings/language-region'),
        },
        {
          icon: Bell,
          title: 'Notifications',
          disabled: true,
          suffix: (
            <Switch
              isSelected={preferences.notifications_enabled}
              onSelectedChange={toggleMaster}
            />
          ),
        },
        {
          icon: MoonStar,
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
      title: 'Notification Types',
      items: NOTIFICATION_TYPE_LABELS.map(({ type, label }) => ({
        icon: getNotificationTypeIcon(type),
        title: label,
        disabled: true,
        iconColor: getColor(type),
        suffix: (
          <Switch
            isSelected={preferences[type]}
            onSelectedChange={() => toggleType(type)}
            isDisabled={!preferences.notifications_enabled}
          />
        ),
      })),
    },
    {
      title: 'Help & Support',
      items: [
        {
          icon: CircleAlert,
          title: 'Report a Problem',
          onPress: () => {},
        },
        {
          icon: CircleQuestionMark,
          title: 'FAQs',
          onPress: () => router.push('/settings/faq'),
        },
        {
          icon: FileText,
          title: 'Terms and Conditions',
          onPress: () => router.push('/settings/terms'),
        },
        {
          icon: ShieldCheck,
          title: 'Privacy Policy',
          onPress: () => router.push('/settings/privacy-policy'),
        },
        {
          icon: UsersRound,
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
          <Text className='text-foreground text-base font-interMedium'>
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