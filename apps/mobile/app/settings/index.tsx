import { View, Text } from 'react-native'
import React, { useState } from 'react'
import { useRouter } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import ComingSoonChip from 'components/display/ComingSoonChip'

import { ListGroup, Separator, Chip } from 'heroui-native'

import { IconKey, IconMail, IconGlobe, IconBell, IconMoonStars, IconAlertCircle, IconHelpCircle, IconFileText, IconShieldCheck, IconUsersGroup, IconChevronRight, IconAdjustments } from '@tabler/icons-react-native';
import type { Icon } from '@tabler/icons-react-native';

import { useColors, useThemePreference } from '@/hooks/useTheme'
import { useNotificationPreferences } from '@/hooks/notifications'
import { useUserPreferences } from '@/hooks/preferences/useUserPreferences'
import { useEmailChangeEligibility, usePasswordSignInStatus } from '@/hooks/auth'

import { ALLOW_FILIPINO } from '@repo/i18n'
import { useTranslation } from '@/hooks/i18n/useTranslation'

import AppearanceSheet, { getThemeModeLabel } from './components/AppearanceSheet'

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

function StatusChip({ label }: { label: string }) {
  return (
    <Chip size="sm" variant="soft" color="default" animation="disable-all" className="px-2">
      <Chip.Label className="text-[11px] font-nunitoSemiBold text-muted">{label}</Chip.Label>
    </Chip>
  );
}

export default function Index() {
  const router = useRouter()
  const { language, t } = useTranslation()
  const { colors } = useColors();
  const { themeMode, setThemeMode } = useThemePreference();
  const [appearanceSheetOpen, setAppearanceSheetOpen] = useState(false);

  const { preferences: notifPrefs } = useNotificationPreferences();
  const { preferences: rentalPrefs, hasPrefs } = useUserPreferences();
  const { data: passwordSignInStatus } = usePasswordSignInStatus();
  const { data: emailChangeEligibility } = useEmailChangeEligibility();

  // Both masters on → "On", both off → "Off", mixed → "Partial".
  const notificationSummary =
    notifPrefs.notifications_enabled && notifPrefs.push_enabled
      ? t('settings.mobile.summary.on')
      : !notifPrefs.notifications_enabled && !notifPrefs.push_enabled
        ? t('settings.mobile.summary.off')
        : t('settings.mobile.summary.partial');

  const rentalSummary = (() => {
    if (!rentalPrefs || !hasPrefs) return t('settings.mobile.summary.notSet');
    const cities = rentalPrefs.selectedCities;
    const cityPart = cities.length > 0 ? cities.slice(0, 2).join(", ") + (cities.length > 2 ? ` +${cities.length - 2}` : "") : "CAMANAVA";
    return `${cityPart} · ₱${rentalPrefs.budgetMin.toLocaleString()}–${rentalPrefs.budgetMax.toLocaleString()}`;
  })();

  // Opens only for accounts with a password; Google-only accounts have none to
  // change. Stays disabled while the status loads or if it can't be read.
  const changePasswordItem = (): SettingItem => {
    const base = { icon: IconKey, title: t('settings.security.changePassword') };
    if (passwordSignInStatus === 'has_password') {
      return {
        ...base,
        onPress: () => router.push('/settings/change-password'),
        suffix: <IconChevronRight size={16} color={colors.gray500} />,
      };
    }
    if (passwordSignInStatus === 'no_password') {
      return {
        ...base,
        disabled: true,
        suffix: <StatusChip label={t('settings.security.googleOnly')} />,
      };
    }
    return { ...base, disabled: true };
  };

  // Opens only for email/password accounts without Google; linked Google +
  // password accounts stay on Google sign-in for email changes. Stays
  // disabled while the status loads or if it can't be read.
  const changeEmailItem = (): SettingItem => {
    const base = { icon: IconMail, title: t('settings.security.changeEmail') };
    if (emailChangeEligibility === 'eligible') {
      return {
        ...base,
        onPress: () => router.push('/settings/change-email'),
        suffix: <IconChevronRight size={16} color={colors.gray500} />,
      };
    }
    if (emailChangeEligibility === 'google') {
      return {
        ...base,
        disabled: true,
        suffix: <StatusChip label={t('settings.security.googleOnly')} />,
      };
    }
    return { ...base, disabled: true };
  };

  const sections: SettingSection[] = [
    {
      title: t('settings.mobile.security'),
      items: [
        changePasswordItem(),
        changeEmailItem(),
      ],
    },
    {
      title: t('settings.mobile.preferences'),
      items: [
        {
          icon: IconAdjustments,
          title: t('settings.rentalPreferences'),
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
          title: t('settings.mobile.languageRegion'),
          // The screen exists and is store-backed; the switch itself stays
          // gated until the core surfaces are translated. Flip the flag to
          // enable this row and the switchers together.
          disabled: !ALLOW_FILIPINO,
          onPress: ALLOW_FILIPINO ? () => router.push('/settings/language-region') : undefined,
          suffix: ALLOW_FILIPINO ? (
            <IconChevronRight size={16} color={colors.gray500} />
          ) : (
            <ComingSoonChip />
          ),
        },
        {
          icon: IconBell,
          title: t('settings.notifications'),
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
          title: t('settings.mobile.appearance'),
          onPress: () => setAppearanceSheetOpen(true),
          suffix: (
            <View className="flex-row items-center gap-1">
              <Text className='text-muted text-sm font-inter'>
                {getThemeModeLabel(themeMode, language)}
              </Text>
              <IconChevronRight size={16} color={colors.gray500} />
            </View>
          ),
        },
      ],
    },
    {
      title: t('settings.help'),
      items: [
        {
          icon: IconAlertCircle,
          title: t('settings.help.reportProblem'),
          disabled: true,
          suffix: <ComingSoonChip />,
        },
        {
          icon: IconHelpCircle,
          title: t('settings.help.faq'),
          onPress: () => router.push('/settings/faq'),
        },
        {
          icon: IconFileText,
          title: t('settings.mobile.terms'),
          onPress: () => router.push('/settings/terms'),
        },
        {
          icon: IconShieldCheck,
          title: t('settings.help.privacy'),
          onPress: () => router.push('/settings/privacy-policy'),
        },
        {
          icon: IconUsersGroup,
          title: t('settings.help.about'),
          onPress: () => router.push('/settings/about'),
        }
      ],
    },
  ]

  return (
    <ScreenWrapper
      background="grouped"
      scrollable
      bottomPadding={50}
      header={<StandardHeader title={t('settings.title')} />}
      className='p-5'
    >
      {sections.map((section, sIndex) => (
        <View key={section.title} className={`flex gap-3 ${sIndex > 0 ? 'mt-5' : ''}`}>
          <Text className='text-foreground text-base font-nunitoSemiBold'>
            {section.title}
          </Text>

          <ListGroup className="bg-overlay shadow-none border border-border">
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
      <AppearanceSheet
        isOpen={appearanceSheetOpen}
        onOpenChange={setAppearanceSheetOpen}
        themeMode={themeMode}
        onSelect={setThemeMode}
      />
    </ScreenWrapper>
  )
}
