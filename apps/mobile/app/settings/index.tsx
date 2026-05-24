import { View, Text } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'

import { ListGroup, Separator, Switch } from 'heroui-native'

import {
  IconKey,
  IconMail,
  IconBell,
  IconMoonStars,
  IconWorld,
  IconExclamationCircle,
  IconQuestionMark,
  IconFileDescription,
  IconShieldCheck,
} from '@tabler/icons-react-native'

import { COLORS } from '@repo/constants'

export default function Index() {
  const router = useRouter()

  const [hasNotification, setHasNotification] = useState<boolean>(false)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)

  return (
    <ScreenWrapper
      scrollable
      bottomPadding={50}
      header={<StandardHeader title='Settings' />}
      backgroundColor={COLORS.darkerWhite}
      className='p-5'
    >
      {/* Security */}
      <View className='flex gap-3'>
        <Text className='text-text text-base font-inter'>Security</Text>

        <ListGroup>
          <ListGroup.Item onPress={() => {}}>
            <ListGroup.ItemPrefix>
              <IconKey size={22} />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>Change Password</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>

          <Separator className='mx-4' />

          <ListGroup.Item onPress={() => {}}>
            <ListGroup.ItemPrefix>
              <IconMail size={22} />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>Change Email</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
        </ListGroup>
      </View>

      {/* Preferences */}
      <View className='flex gap-3 mt-5'>
        <Text className='text-text text-base font-inter'>Preferences</Text>

        <ListGroup>
          <ListGroup.Item onPress={() => router.push('/settings/language-region')}>
            <ListGroup.ItemPrefix>
              <IconWorld size={22} />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>Language & Region</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>

          <Separator className='mx-4' />

          <ListGroup.Item disabled>
            <ListGroup.ItemPrefix>
              <IconBell size={22} />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>Notifications</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              <Switch
                isSelected={hasNotification}
                onSelectedChange={setHasNotification}
              />
            </ListGroup.ItemSuffix>
          </ListGroup.Item>

          <Separator className='mx-4' />

          <ListGroup.Item disabled>
            <ListGroup.ItemPrefix>
              <IconMoonStars size={22} />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>Dark Mode</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              <Switch
                isSelected={isDarkMode}
                onSelectedChange={setIsDarkMode}
              />
            </ListGroup.ItemSuffix>
          </ListGroup.Item>
        </ListGroup>
      </View>

      {/* Help & Support */}
      <View className='flex gap-3 mt-5'>
        <Text className='text-text text-base font-inter'>Help & Support</Text>

        <ListGroup>
          <ListGroup.Item onPress={() => {}}>
            <ListGroup.ItemPrefix>
              <IconExclamationCircle size={22} />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>Report a Problem</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>

          <Separator className='mx-4' />

          <ListGroup.Item onPress={() => {}}>
            <ListGroup.ItemPrefix>
              <IconQuestionMark size={22} />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>FAQs</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>

          <Separator className='mx-4' />

          <ListGroup.Item onPress={() => {}}>
            <ListGroup.ItemPrefix>
              <IconFileDescription size={22} />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>Terms and Conditions</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>

          <Separator className='mx-4' />

          <ListGroup.Item onPress={() => {}}>
            <ListGroup.ItemPrefix>
              <IconShieldCheck size={22} />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>Privacy Policy</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
        </ListGroup>
      </View>
    </ScreenWrapper>
  )
}