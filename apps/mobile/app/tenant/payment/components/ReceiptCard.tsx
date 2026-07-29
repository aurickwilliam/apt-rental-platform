import { View, Text } from 'react-native'
import { Card, Button } from 'heroui-native'
import { formatPesoDisplay } from '@repo/utils'

import {
  IconCircleCheckFilled,
  IconDownload,
  IconShare2,
} from '@tabler/icons-react-native'

import { useColors } from '@/hooks/useTheme'

import ZigzagEdge from './ZigzagEdge'

interface ReceiptCardProps {
  apartmentName: string
  landlordName: string
  date: string
  time: string
  method: string
  amount: number
  referenceNumber: string
  /** Resolved color value for the zigzag cutout (e.g. from useColors() or a hex string) */
  backgroundColor: string
}

export default function ReceiptCard({
  apartmentName,
  landlordName,
  date,
  time,
  method,
  amount,
  referenceNumber,
  backgroundColor,
}: ReceiptCardProps) {
  const { colors } = useColors()

  return (
    <View className='relative w-full'>
      <Card className='bg-white rounded-t-2xl rounded-b-none w-full overflow-hidden shadow-none'>
        <Card.Header>
          <View className='items-center mb-6'>
            <IconCircleCheckFilled size={48} color={colors.success} />
            <Text className='text-xl font-interSemiBold text-success mt-3'>
              Payment Successful
            </Text>
          </View>
        </Card.Header>
        <Card.Body className='px-6 pb-0'>
          <View className='border-t border-dashed border-grey-300 pt-5' />
          <View className='gap-4'>
            <ReceiptRow label='Apartment' value={apartmentName} />
            <ReceiptRow label='Landlord' value={landlordName} />
            <ReceiptRow label='Date' value={date} />
            <ReceiptRow label='Time' value={time} />
            <ReceiptRow label='Payment Method' value={method} />
            <ReceiptRow label='Amount Paid' value={formatPesoDisplay(amount)} highlight />
            <ReceiptRow label='Reference No.' value={referenceNumber} />
          </View>
          <View className='border-t border-dashed border-grey-300 mt-5 pt-4'>
            <Text className='text-xs text-grey-300 text-center font-inter'>
              Thank you for your payment!
            </Text>
          </View>
        </Card.Body>
        <Card.Footer className='mt-10 mb-4 flex-row items-center justify-center gap-4'>
          <Button onPress={() => {}} variant='ghost' size='sm'>
            <View className='mr-1.5'>
              <IconDownload size={16} color={colors.gray400} />
            </View>
            <Button.Label className='text-muted'>Save to Photos</Button.Label>
          </Button>
          <Button onPress={() => {}} variant='ghost' size='sm'>
            <View className='mr-1.5'>
              <IconShare2 size={16} color={colors.gray400} />
            </View>
            <Button.Label className='text-muted'>Share Receipt</Button.Label>
          </Button>
        </Card.Footer>

        <ZigzagEdge
          cutColor={backgroundColor}
          depth={13}
          toothWidth={20}
        />
      </Card>
    </View>
  )
}

function ReceiptRow({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <View className='flex-row justify-between items-center'>
      <Text className='text-sm text-foreground font-inter'>{label}</Text>
      <Text
        className={`text-sm font-interSemiBold ${
          highlight ? 'text-accent' : 'text-foreground'
        }`}
      >
        {value}
      </Text>
    </View>
  )
}
