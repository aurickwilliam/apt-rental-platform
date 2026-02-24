import { View, Text } from 'react-native'
import { useState } from 'react'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import SettingOptionButton from 'components/buttons/SettingOptionButton'

import { COLORS, LANGUAGES, REGIONS } from '@repo/constants'

export default function LanguageAndRegion() {
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].label);
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]);

  return (
    <ScreenWrapper
      header={
        <StandardHeader title='Language & Region' />
      }
      backgroundColor={COLORS.darkerWhite}
      className='p-5'
    >
      <View className='flex gap-3'>
        <SettingOptionButton 
          label="Language"
          hasBottomSheet
          bottomSheetLabel="Select Language"
          bottomSheetOptions={LANGUAGES.map(lang => lang.label)}
          bottomSheetValue={selectedLanguage}
          onBottomSheetSelect={(value) => setSelectedLanguage(value)}
        />

        <SettingOptionButton 
          label="Region"
          hasBottomSheet
          bottomSheetLabel="Select Region"
          bottomSheetOptions={REGIONS}
          bottomSheetValue={selectedRegion}
          onBottomSheetSelect={(value) => setSelectedRegion(value)}
        />
      </View>
      <Text className='text-grey-500 text-sm font-inter mt-5'>
        Note: Some changes may require restarting the app.
      </Text>
    </ScreenWrapper>
  )
}
