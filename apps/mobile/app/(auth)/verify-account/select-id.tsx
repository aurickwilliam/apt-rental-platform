import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'

import { ListGroup, Separator } from 'heroui-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'

import { VALID_IDS, SECONDARY_IDS } from '@repo/constants'

import { useColors } from '@/hooks/useTheme'

export default function SelectId() {
  const router = useRouter();
  const { colors } = useColors();

  // Handle navigation when an ID is selected
  const handleIdSelection = (id: string) => {
    router.push(`/(auth)/verify-account/upload-id?selectedId=${id}`);
  }

  const renderListGroup = (ids: string[]) => (
    <ListGroup className='shadow-none border border-border'>
      {
        ids.map((id, index) => (
          <View key={id}>
            {index > 0 && <Separator className='mx-4' />}

            <ListGroup.Item onPress={() => handleIdSelection(id)}>
              <ListGroup.ItemContent>
                <ListGroup.ItemTitle className='font-interMedium'>
                  {id}
                </ListGroup.ItemTitle>
              </ListGroup.ItemContent>

              <ListGroup.ItemSuffix iconProps={{ size: 20, color: colors.textPrimary }} />
            </ListGroup.Item>
          </View>
        ))
      }
    </ListGroup>
  )

  return (
    <ScreenWrapper
      className='p-5'
      header={
        <StandardHeader title='Select a Valid ID' />
      }
      scrollable
    >
      <View className='flex gap-3'>
        <Text className='text-foreground text-base font-interMedium'>
          List of Valid IDs:
        </Text>
        {renderListGroup(VALID_IDS)}

        <Text className='text-foreground text-base font-interMedium'>
          List of Secondary IDs:
        </Text>
        {renderListGroup(SECONDARY_IDS)}
      </View>
    </ScreenWrapper>
  )
}
