import { View, Text, Image } from 'react-native'
import { useRouter } from 'expo-router'

import PillButton from '../buttons/PillButton'

import { PAYMENT_METHOD_LOGOS } from '@/constants/images'

import { IconTrash } from '@tabler/icons-react-native'

interface PaymentMethodCardProps {
  method: {
    id: number
    method: string
    type: string
    number: string
    name: string
    expireDate?: string
  }
}

export default function PaymentMethodCard({
  method
}: PaymentMethodCardProps ) {
  const router = useRouter();

  let logoSource = null;

  switch (method.method) {
    case 'GCash':
      logoSource = PAYMENT_METHOD_LOGOS.gcash;
      break;
    case 'Maya':
      logoSource = PAYMENT_METHOD_LOGOS.maya;
      break;
    case 'Visa':
      logoSource = PAYMENT_METHOD_LOGOS.visa;
      break;
    case 'Mastercard':
      logoSource = PAYMENT_METHOD_LOGOS.mastercard;
      break;
    default:
      logoSource = null;
  }

  // TODO: Get a Better Logo for Maya, GCash, and other local e-wallets. Maybe use SVGs instead of PNGs for better quality?

  return (
    <View className='w-full bg-white rounded-2xl p-4'>
      {/* Logo and Number */}
      <View className='flex-row items-center justify-between gap-3'>
         <View className='overflow-hidden rounded-lg h-12 w-28'>
          <Image 
            source={logoSource} 
            style={{
              width: '100%',
              height: '100%'
            }}
            resizeMode='contain'
          />
        </View>

        <View className='flex items-end'>
          <Text className='text-text text-base font-interMedium'>
            {method.number}
          </Text>
          {
            (method.method === 'Visa' || method.method === 'Mastercard') && (
              <Text className='text-grey-500 text-sm font-inter'>
                Exp: {method.expireDate}
              </Text>
            )
          }
        </View>
      </View>

      {/* Name and Delete Button */}
      <View className='flex-row items-center justify-between gap-3 mt-5'>
        <View>
          <Text className='text-grey-500 text-sm font-inter'>
            {method.method === 'GCash' || method.method === 'Maya' ? 'Account Name:' : 'Cardholder Name:'}
          </Text>
          <Text className='text-text text-base font-interMedium'>
            {method.name}
          </Text>
        </View>
         <View>
          <PillButton 
            label='Delete'
            type='danger'
            size='sm'
            leftIconName={IconTrash}
            width='w-32'
          />
         </View>
      </View>
    </View>
  )
}