import { View, Text, Image } from 'react-native'
import { useLocalSearchParams } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import PillButton from '@/components/buttons/PillButton';

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
      <View className='flex-1 items-center justify-center'>
        {/* Image of E-wallet */}
        <View className='size-48 overflow-hidden rounded-xl'>
          <Image 
            source={imageSource}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </View>

        <View className='mt-10'>
          <Text className='text-text text-center text-lg font-interMedium'>
            You’ll be redirected to <Text className={`font-interSemiBold ${method === 'GCash' ? 'text-primary' : 'text-greenHulk-200'}`}>{methodText}</Text> to authorize this payment method.
          </Text>
        </View>

        <View className='mt-5 w-full'>
          <PillButton 
            label={buttonLabel}
            isFullWidth
            onPress={() => console.log('Redirecting to e-wallet...')}
          />
        </View>
      </View>
    </ScreenWrapper>
  )
}