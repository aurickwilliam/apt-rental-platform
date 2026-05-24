import { View, Text, Image } from 'react-native'
import { Card, PressableFeedback } from 'heroui-native'
import { COLORS } from '@repo/constants'

interface PropertyCardProps {
  apartmentName: string
  barangay: string
  city: string
  status: 'Available' | 'Occupied' | 'Under Maintenance' | 'Unverified'
  thumbnailUrl: string | undefined
  onPress: () => void
}

export default function PropertyCard({
  apartmentName,
  barangay,
  city,
  status,
  thumbnailUrl,
  onPress,
}: PropertyCardProps) {

  const STATUS_STYLES = {
    'Occupied': {
      backgroundColor: COLORS.lightGreen,
      color: COLORS.greenHulk,
    },
    'Under Maintenance': {
      backgroundColor: COLORS.lightYellowish,
      color: COLORS.yellowish,
    },
    'Available': {
      backgroundColor: COLORS.lightBlue,
      color: COLORS.primary,
    },
    'Unverified': {
      backgroundColor: COLORS.lightLightLightGrey,
      color: COLORS.grey,
    },
  }

  return (
    <PressableFeedback onPress={onPress}>
      <PressableFeedback.Highlight />
      <Card
        className='flex-row overflow-hidden border border-grey-300 p-0 shadow-none'
      >
        {/* Image — fills full height, left corners rounded to match card */}
        <Image
          source={{ uri: thumbnailUrl }}
          className='w-30 shrink-0'
          style={{
            aspectRatio: 1,
            borderTopLeftRadius: 16,
            borderBottomLeftRadius: 16,
          }}
          resizeMode='cover'
        />

        {/* Content */}
        <Card.Body className='px-3 py-2 min-w-0 justify-between'>
          <View>
            <Card.Title
              className='text-base font-interMedium text-text leading-snug'
              numberOfLines={1}
              ellipsizeMode='tail'
            >
              {apartmentName}
            </Card.Title>

            <Card.Description
              className='text-grey-500 text-sm font-inter'
              numberOfLines={2}
              ellipsizeMode='tail'
            >
              {barangay}, {city}
            </Card.Description>
          </View>

          <View
            className='px-2 py-1 rounded-full self-start border'
            style={{
              backgroundColor: STATUS_STYLES[status].backgroundColor,
              borderColor: STATUS_STYLES[status].color,
            }}
          >
            <Text
              className='text-xs font-inter'
              style={{ color: STATUS_STYLES[status].color }}
            >
              {status}
            </Text>
          </View>
        </Card.Body>
      </Card>
    </PressableFeedback>
  )
}