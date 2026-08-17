import { View, Text } from 'react-native'
import { ListGroup, Separator, Switch, Button } from 'heroui-native'
import { IconBell, IconBellRinging, IconMessageCircle } from '@tabler/icons-react-native'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'

import { NOTIFICATION_TYPE_LABELS } from 'constants/notifications'
import { useNotificationPreferences, useNotificationTypeColor, getNotificationTypeIcon } from '@/hooks/notifications'
import { useColors } from '@/hooks/useTheme'
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/service/notificationService'
import type { NotificationPreferenceType } from '@/service/notificationService'

type GeneralToggleKey = 'notifications_enabled' | 'push_enabled' | 'show_chat_toasts'

const GENERAL_TOGGLES: {
  key: GeneralToggleKey
  icon: typeof IconBell
  title: string
  description: string
}[] = [
  {
    key: 'notifications_enabled',
    icon: IconBell,
    title: 'In-App Notifications',
    description: 'Show banner notifications while using the app',
  },
  {
    key: 'push_enabled',
    icon: IconBellRinging,
    title: 'Push Notifications',
    description: 'Receive alerts on your device when the app is closed',
  },
  {
    key: 'show_chat_toasts',
    icon: IconMessageCircle,
    title: 'Message Toasts in Chat',
    description: 'Show a banner for new messages in the chat you are viewing',
  },
]

export default function NotificationSettingsScreen() {
  const { colors } = useColors();
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
      header={<StandardHeader title='Notifications' />}
      className='p-5'
    >
      <View className='flex gap-3'>
        <Text className='text-foreground text-base font-interMedium'>General</Text>

        <ListGroup className="shadow-none border border-border">
          {GENERAL_TOGGLES.map(({ key, icon: Icon, title, description }, index) => (
            <View key={key}>
              {index > 0 && <Separator className='mx-4' />}

              <ListGroup.Item disabled>
                <ListGroup.ItemPrefix>
                  <Icon size={20} color={colors.textPrimary} />
                </ListGroup.ItemPrefix>

                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle>{title}</ListGroup.ItemTitle>
                  <ListGroup.ItemDescription>{description}</ListGroup.ItemDescription>
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
        <Text className='text-foreground text-base font-interMedium'>Notification Types</Text>

        <ListGroup className="shadow-none border border-border">
          {NOTIFICATION_TYPE_LABELS.map(({ type, label }, index) => (
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
                  <ListGroup.ItemTitle>{label}</ListGroup.ItemTitle>
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
        Reset to Defaults
      </Button>
    </ScreenWrapper>
  )
}
