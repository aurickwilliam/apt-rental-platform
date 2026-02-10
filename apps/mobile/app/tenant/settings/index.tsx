import { View, Text } from 'react-native'
import { useState } from 'react'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import SettingOptionButton from 'components/buttons/SettingOptionButton'

import { IconChevronRight } from '@tabler/icons-react-native'

import { COLORS } from 'constants/colors'

export default function Index() {
  const [hasNotification, setHasNotification] = useState<boolean>(false);

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
          iconName={IconChevronRight} 
          hasToggle
          toggleValue={hasNotification}
          onToggleChange={setHasNotification}
        />
      </View>
    </ScreenWrapper>
  )
}