import { View, Text } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import SettingOptionButton from 'components/buttons/SettingOptionButton'

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
  const router = useRouter();

  const [hasNotification, setHasNotification] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  return (
    <ScreenWrapper
      scrollable
      bottomPadding={50}
      header={
        <StandardHeader title='Settings' />
      }
      backgroundColor={COLORS.darkerWhite}
      className='p-5'
    >
      {/* Security */}
      <View className='flex gap-3'>
        <Text className='text-text text-base font-inter'>
          Security
        </Text>
        
        <SettingOptionButton 
          label="Change Password" 
          iconName={IconKey} 
        />

        <SettingOptionButton 
          label="Change Email" 
          iconName={IconMail} 
        />
      </View>
      
      {/* Preferences */}
      <View className='flex gap-3 mt-5'>
        <Text className='text-text text-base font-inter'>
          Preferences
        </Text>
        
        <SettingOptionButton 
          label="Language & Region" 
          iconName={IconWorld} 
          onPress={() => router.push('/tenant/settings/language-region')}
        />

        <SettingOptionButton 
          label="Notifications" 
          iconName={IconBell} 
          hasToggle
          toggleValue={hasNotification}
          onToggleChange={setHasNotification}
        />

        <SettingOptionButton 
          label="Dark Mode" 
          iconName={IconMoonStars} 
          hasToggle
          toggleValue={isDarkMode}
          onToggleChange={setIsDarkMode}
        />
      </View>

      {/* Help & Support */}
      <View className='flex gap-3 mt-5'>
        <Text className='text-text text-base font-inter'>
          Help & Support
        </Text>
        
        <SettingOptionButton 
          label="Report a Problem" 
          iconName={IconExclamationCircle} 
        />

        <SettingOptionButton 
          label="FAQs" 
          iconName={IconQuestionMark} 
        />

        <SettingOptionButton 
          label="Terms and Conditions" 
          iconName={IconFileDescription} 
        />

        <SettingOptionButton 
          label="Privacy Policy" 
          iconName={IconShieldCheck} 
        />
      </View>
    </ScreenWrapper>
  )
}