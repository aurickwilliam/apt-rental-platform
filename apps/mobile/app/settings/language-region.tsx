import { useState } from 'react'
import { View, Text, Pressable } from 'react-native'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import ComingSoonChip from 'components/display/ComingSoonChip'

import { ListGroup, Separator, BottomSheet } from 'heroui-native'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'

import { ALLOW_FILIPINO, APP_LANGUAGES } from '@repo/i18n'

import { useTranslation } from '@/hooks/i18n/useTranslation'

type LanguageOption = (typeof APP_LANGUAGES)[number]

export default function LanguageAndRegion() {
  const { language, setLanguage, t } = useTranslation()
  const [languageSheetOpen, setLanguageSheetOpen] = useState(false)

  // English / Filipino read the same in every language, by design.
  const currentLabel =
    APP_LANGUAGES.find(({ code }) => code === language)?.label ?? APP_LANGUAGES[0].label

  const renderSheetHeader = (label: string) => (
    <View>
      <Text className='text-lg text-center text-foreground font-nunitoSemiBold border-b border-border pb-3 mb-4'>
        {label}
      </Text>
    </View>
  )

  const renderSheetEmpty = () => (
    <View className='h-full py-8 items-center justify-center'>
      <Text className='text-lg text-gray-500 font-inter'>
        No options available
      </Text>
    </View>
  )

  return (
    <>
      <ScreenWrapper
        header={<StandardHeader title={t('settings.mobile.languageRegion')} />}
        className='p-5'
      >
        <ListGroup className="shadow-none border border-border">
          {/* One language row; the sheet stays mounted and is driven by
              `isOpen`, as every BottomSheet in this app must be. */}
          <ListGroup.Item
            onPress={ALLOW_FILIPINO ? () => setLanguageSheetOpen(true) : undefined}
            disabled={!ALLOW_FILIPINO}
          >
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>{t('settings.language.title')}</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              <Text className='text-muted text-sm font-inter mr-1'>
                {currentLabel}
              </Text>
            </ListGroup.ItemSuffix>
          </ListGroup.Item>

          <Separator className='mx-4' />

          {/* Region is an intentional disabled stub: the feature is planned
              but not built, so it explains itself instead of pretending to
              work. No sheet exists until that feature is designed. */}
          <ListGroup.Item disabled>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>{t('settings.region.title')}</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              <ComingSoonChip />
            </ListGroup.ItemSuffix>
          </ListGroup.Item>
        </ListGroup>
      </ScreenWrapper>

      {/* Language Bottom Sheet */}
      <BottomSheet
        isOpen={languageSheetOpen}
        onOpenChange={setLanguageSheetOpen}
      >
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content
            snapPoints={['50%', '75%']}
            enableOverDrag={false}
            enableDynamicSizing={false}
            contentContainerClassName='h-full'
          >
            <BottomSheetFlatList
              data={[...APP_LANGUAGES] as LanguageOption[]}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <Pressable
                  className={`p-4 rounded-2xl mb-2 ${item.code === language ? 'bg-accent/10' : 'bg-surface'}`}
                  onPress={() => {
                    setLanguage(item.code)
                    setLanguageSheetOpen(false)
                  }}
                >
                  <Text className='text-base text-foreground text-left font-inter'>{item.label}</Text>
                </Pressable>
              )}
              ListHeaderComponent={renderSheetHeader(t('settings.mobile.selectLanguage'))}
              ListEmptyComponent={renderSheetEmpty}
              contentContainerStyle={{
                paddingBottom: 80,
              }}
            />
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </>
  )
}
