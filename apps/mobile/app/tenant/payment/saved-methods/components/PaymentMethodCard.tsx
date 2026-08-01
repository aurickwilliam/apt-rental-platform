import { View, Text, Image, TouchableOpacity } from 'react-native'

import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable'

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
        <TouchableOpacity
          className='w-24 bg-danger rounded-2xl justify-center items-center gap-1'
          onPress={onDelete}
          activeOpacity={0.8}
          accessibilityRole='button'
          accessibilityLabel={`Delete ${method.method}`}
        >
          <IconTrash size={20} color='#FFFFFF' />
          <Text className='text-white text-xs font-interMedium'>Delete</Text>
        </TouchableOpacity>
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
            <Text className='text-muted text-xs font-interMedium'>{method.method}</Text>
          </View>
        )}

        {/* Number and Details */}
        <View className='flex-1'>
          <Text className='text-foreground text-sm font-interMedium' numberOfLines={1}>
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
