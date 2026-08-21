import { View, Text, Image } from 'react-native'

import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable'

import { Button } from 'heroui-native'

import { IconTrash } from '@tabler/icons-react-native'

import { PAYMENT_METHOD_LOGOS } from '@/constants/images'

export interface PaymentMethod {
  id: number
  method: string
  type: string
  number: string
  name: string
  expireDate?: string
}

interface PaymentMethodCardProps {
  method: PaymentMethod
  onDelete: () => void
}

function getLogoSource(method: string) {
  switch (method) {
    case 'GCash':
      return PAYMENT_METHOD_LOGOS.gcashBig
    case 'Maya':
      return PAYMENT_METHOD_LOGOS.mayaBig
    case 'Visa':
      return PAYMENT_METHOD_LOGOS.visa
    case 'Mastercard':
      return PAYMENT_METHOD_LOGOS.mastercard
    default:
      return null
  }
}

function maskMobileNumber(number: string): string {
  if (number.length <= 7) return number
  const visibleStart = number.slice(0, 4)
  const visibleEnd = number.slice(-3)
  const maskedMiddle = '•'.repeat(number.length - 7)
  return `${visibleStart}${maskedMiddle}${visibleEnd}`
}

export default function PaymentMethodCard({ method, onDelete }: PaymentMethodCardProps) {
  const logoSource = getLogoSource(method.method)
  const isCard = method.type === 'card'
  const displayNumber = isCard ? method.number : maskMobileNumber(method.number)

  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={() => (
        <Button
          variant='danger'
          size='sm'
          onPress={onDelete}
          className='w-24 h-full rounded-2xl'
        >
          <IconTrash size={20} color='#FFFFFF' />
          <Button.Label>Delete</Button.Label>
        </Button>
      )}
    >
      <View className='w-full bg-surface rounded-2xl p-3 flex-row items-center gap-3 border border-border'>
        {/* Logo */}
        {logoSource ? (
          <View className='h-8 w-14 overflow-hidden rounded-md'>
            <Image
              source={logoSource}
              style={{ width: '100%', height: '100%' }}
              resizeMode='contain'
            />
          </View>
        ) : (
          <View className='h-8 px-2.5 bg-surface-secondary rounded-md items-center justify-center'>
            <Text className='text-muted text-xs font-nunitoSemiBold'>{method.method}</Text>
          </View>
        )}

        {/* Number and Details */}
        <View className='flex-1'>
          <Text className='text-foreground text-sm font-nunitoSemiBold' numberOfLines={1}>
            {displayNumber}
          </Text>
          <Text className='text-muted text-xs font-inter' numberOfLines={1}>
            {isCard ? `Exp ${method.expireDate} · ${method.name}` : method.name}
          </Text>
        </View>
      </View>
    </ReanimatedSwipeable>
  )
}
