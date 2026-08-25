import { View, Text, Image } from 'react-native'
import { useLocalSearchParams } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'

import { Button } from 'heroui-native'

import { PAYMENT_METHOD_LOGOS } from '@/constants/images';

export default function EWalletRedirect() {
  const { method } = useLocalSearchParams();

  const imageSource = method === 'GCash' ? PAYMENT_METHOD_LOGOS.gcashBig : PAYMENT_METHOD_LOGOS.mayaBig;
  const methodText = method === 'GCash' ? 'GCash' : 'Maya';
  const buttonLabel = method === 'GCash' ? 'Connect to GCash' : 'Connect to Maya';

  return (
    <ScreenWrapper
      className='p-5'
      header={
        <StandardHeader title='Link E-Wallet Account' />
      }
    >
      <View className='flex-1'>
        <View className='flex-1 items-center justify-center gap-6'>
          {/* Image of E-wallet */}
          <View className='size-48 overflow-hidden rounded-3xl bg-surface'>
            <Image
              source={imageSource}
              style={{
                width: '100%',
                height: '100%',
              }}
              resizeMode='contain'
            />
          </View>

          <Text className='text-foreground text-center text-lg font-nunitoSemiBold'>
            You’ll be redirected to <Text className={`font-nunitoSemiBold ${method === 'GCash' ? 'text-primary' : 'text-success'}`}>{methodText}</Text> to authorize this payment method.
          </Text>
        </View>

        <Button
          className='w-full'
          onPress={() => console.log('Redirecting to e-wallet...')}
        >
          <Button.Label>
            {buttonLabel}
          </Button.Label>
        </Button>
      </View>
    </ScreenWrapper>
  )
}
