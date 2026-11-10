import { View, Text } from 'react-native'
import { ListGroup, Separator, Switch, Button } from 'heroui-native'
import { IconBell, IconBellRinging, IconMessageCircle } from '@tabler/icons-react-native'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import type { TranslationKey } from '@repo/i18n'
import { useTranslation } from '@/hooks/i18n/useTranslation'

import { NOTIFICATION_TYPE_LABELS } from 'constants/notifications'
import { useNotificationPreferences, useNotificationTypeColor, getNotificationTypeIcon } from '@/hooks/notifications'
import { useColors } from '@/hooks/useTheme'
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/service/notifications/notificationService'
import type { NotificationPreferenceType } from '@/service/notifications/notificationService'

type GeneralToggleKey = 'notifications_enabled' | 'push_enabled' | 'show_chat_toasts'

const GENERAL_TOGGLES: {
  key: GeneralToggleKey
  icon: typeof IconBell
  titleKey: TranslationKey
  descriptionKey: TranslationKey
}[] = [
  {
    key: 'notifications_enabled',
    icon: IconBell,
    titleKey: 'settings.notifications.inApp.title',
    descriptionKey: 'settings.notifications.inApp.description',
  },
  {
    key: 'push_enabled',
    icon: IconBellRinging,
    titleKey: 'settings.notifications.push.title',
    descriptionKey: 'settings.notifications.push.description',
  },
  {
    key: 'show_chat_toasts',
    icon: IconMessageCircle,
    titleKey: 'settings.notifications.chatToasts.title',
    descriptionKey: 'settings.notifications.chatToasts.description',
  },
]

export default function NotificationSettingsScreen() {
  const { colors } = useColors();
  const { t } = useTranslation();
  const { preferences, setPreferences } = useNotificationPreferences();
  const { getColor } = useNotificationTypeColor();

  const toggleGeneral = (key: GeneralToggleKey) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleType = (type: NotificationPreferenceType) => {
    setPreferences((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  // Per-type toggles are shared by both channels, so they only matter when at
  // least one master is on.
  const typesDisabled = !preferences.notifications_enabled && !preferences.push_enabled;

  const resetToDefaults = () => {
    setPreferences(() => ({ ...DEFAULT_NOTIFICATION_PREFERENCES }));
  };

  return (
    <ScreenWrapper
      scrollable
      bottomPadding={50}
      header={<StandardHeader title={t('settings.notifications')} />}
      className='p-5'
    >
      <View className='flex gap-3'>
        <Text className='text-foreground text-base font-nunitoSemiBold'>
          {t('settings.notifications.general')}
        </Text>

        <ListGroup className="shadow-none border border-border">
          {GENERAL_TOGGLES.map(({ key, icon: Icon, titleKey, descriptionKey }, index) => (
            <View key={key}>
              {index > 0 && <Separator className='mx-4' />}

              <ListGroup.Item disabled>
                <ListGroup.ItemPrefix>
                  <Icon size={20} color={colors.textPrimary} />
                </ListGroup.ItemPrefix>

                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{t(titleKey)}</ListGroup.ItemTitle>
                  <ListGroup.ItemDescription>
                    {t(descriptionKey)}
                  </ListGroup.ItemDescription>
                </ListGroup.ItemContent>

                <ListGroup.ItemSuffix>
                  <Switch
                    isSelected={preferences[key]}
                    onSelectedChange={() => toggleGeneral(key)}
                  />
                </ListGroup.ItemSuffix>
              </ListGroup.Item>
            </View>
          ))}
        </ListGroup>
      </View>

      <View className='flex gap-3 mt-5'>
        <Text className='text-foreground text-base font-nunitoSemiBold'>
          {t('settings.notifications.types')}
        </Text>

        <ListGroup className="shadow-none border border-border">
          {NOTIFICATION_TYPE_LABELS.map(({ type, labelKey }, index) => (
            <View key={type}>
              {index > 0 && <Separator className='mx-4' />}

              <ListGroup.Item disabled>
                <ListGroup.ItemPrefix>
                  {(() => {
                    const Icon = getNotificationTypeIcon(type)
                    return <Icon size={20} color={getColor(type)} />
                  })()}
                </ListGroup.ItemPrefix>

                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{t(labelKey)}</ListGroup.ItemTitle>
                </ListGroup.ItemContent>

                <ListGroup.ItemSuffix>
                  <Switch
                    isSelected={preferences[type]}
                    onSelectedChange={() => toggleType(type)}
                    isDisabled={typesDisabled}
                  />
                </ListGroup.ItemSuffix>
              </ListGroup.Item>
            </View>
          ))}
        </ListGroup>
      </View>

      <Button
        variant="outline"
        className="mt-5"
        onPress={resetToDefaults}
      >
        {t('settings.notifications.reset')}
      </Button>
    </ScreenWrapper>
  )
}
