import { Image, View } from 'react-native'

import { Card, PressableFeedback } from 'heroui-native'

interface PastApartmentCardProps {
  apartmentName: string
  barangay: string
  city: string
  leaseStartMonth: string
  leaseStartYear: string
  leaseEndMonth: string
  leaseEndYear: string
  thumbnailUrl: string
  onPress: () => void
}

export default function PastApartmentCard({
  apartmentName,
  barangay,
  city,
  leaseStartMonth,
  leaseStartYear,
  leaseEndMonth,
  leaseEndYear,
  thumbnailUrl,
  onPress
}: PastApartmentCardProps) {

  return (
    <PressableFeedback onPress={onPress} className='rounded-3xl p-0 shadow-none border border-border'>
      <PressableFeedback.Ripple />
      <Card className='flex-row p-0 rounded-3xl'>
        {/* Image */}
        <Image
          source={{ uri: thumbnailUrl }}
          className='size-30 rounded-3xl'
        />

        <Card.Body className='p-3 justify-between'>
          <View>
            <Card.Title
              className='text-base font-interMedium text-foreground leading-snug'
              numberOfLines={1}
              ellipsizeMode='tail'
            >
              {apartmentName}
            </Card.Title>

            <Card.Description
              className='text-muted text-sm font-inter'
              numberOfLines={2}
              ellipsizeMode='tail'
            >
              {barangay}, {city}
            </Card.Description>
          </View>

          <Card.Footer className='p-0'>
            <Card.Description className='text-xs text-foreground font-inter'>
              {leaseStartMonth} {leaseStartYear} - {leaseEndMonth} {leaseEndYear}
            </Card.Description>
          </Card.Footer>
        </Card.Body>
      </Card>
    </PressableFeedback>
  )
}