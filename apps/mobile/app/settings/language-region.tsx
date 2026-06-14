import { useState } from 'react'
import { View, Text, Pressable } from 'react-native'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'

import { ListGroup, Separator, BottomSheet } from 'heroui-native'
import { BottomSheetFlatList } from '@gorhom/bottom-sheet'

import { LANGUAGES, REGIONS } from '@repo/constants'

export default function LanguageAndRegion() {
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].label)
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0])

  const [languageSheetOpen, setLanguageSheetOpen] = useState(false)
  const [regionSheetOpen, setRegionSheetOpen] = useState(false)

  const renderSheetHeader = (label: string) => (
    <View>
      <Text className='text-lg text-center text-foreground font-interMedium border-b border-border pb-3 mb-4'>
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
        header={<StandardHeader title='Language & Region' />}
        className='p-5'
      >
        <ListGroup className="shadow-none border border-border">
          <ListGroup.Item onPress={() => setLanguageSheetOpen(true)}>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>Language</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              <Text className='text-muted text-sm font-inter mr-1'>
                {selectedLanguage}
              </Text>
            </ListGroup.ItemSuffix>
          </ListGroup.Item>

          <Separator className='mx-4' />

          <ListGroup.Item onPress={() => setRegionSheetOpen(true)}>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle>Region</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix>
              <Text className='text-muted text-sm font-inter mr-1'>
                {selectedRegion}
              </Text>
            </ListGroup.ItemSuffix>
          </ListGroup.Item>
        </ListGroup>

        <Text className='text-muted text-sm font-inter mt-5'>
          Note: Some changes may require restarting the app.
        </Text>
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
              data={LANGUAGES.map(lang => lang.label)}
              keyExtractor={(item: string) => item}
              renderItem={({ item }: { item: string }) => (
                <Pressable
                  className={`p-4 rounded-2xl mb-2 ${item === selectedLanguage ? 'bg-accent/10' : 'bg-surface'}`}
                  onPress={() => {
                    setSelectedLanguage(item)
                    setLanguageSheetOpen(false)
                  }}
                >
                  <Text className='text-base text-foreground text-left font-inter'>{item}</Text>
                </Pressable>
              )}
              ListHeaderComponent={renderSheetHeader('Select Language')}
              ListEmptyComponent={renderSheetEmpty}
              contentContainerStyle={{
                paddingBottom: 80,
              }}
            />
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>

      {/* Region Bottom Sheet */}
      <BottomSheet
        isOpen={regionSheetOpen}
        onOpenChange={setRegionSheetOpen}
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
              data={REGIONS}
              keyExtractor={(item: string) => item}
              renderItem={({ item }: { item: string }) => (
                <Pressable
                  className={`p-4 rounded-2xl mb-2 ${item === selectedRegion ? 'bg-accent/10' : 'bg-surface'}`}
                  onPress={() => {
                    setSelectedRegion(item)
                    setRegionSheetOpen(false)
                  }}
                >
                  <Text className='text-base text-foreground text-left font-inter'>{item}</Text>
                </Pressable>
              )}
              ListHeaderComponent={renderSheetHeader('Select Region')}
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