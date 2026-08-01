import { FlatList, View, Text, Image, type ImageSourcePropType } from 'react-native'
import { useRouter } from 'expo-router'

import { ListGroup, Separator } from 'heroui-native'

import { IconWallet } from '@tabler/icons-react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'

import { PAYMENT_METHOD_LOGOS } from '@/constants/images'
import { useColors } from '@/hooks/useTheme'

type PaymentMethodType = {
  id: string
  title: string
  logoSource: ImageSourcePropType
}

const PAYMENT_METHOD_TYPES: PaymentMethodType[] = [
  { id: 'gcash', title: 'GCash', logoSource: PAYMENT_METHOD_LOGOS.gcashBig },
  { id: 'maya', title: 'Maya', logoSource: PAYMENT_METHOD_LOGOS.mayaBig },
  { id: 'card', title: 'Debit/Credit Card', logoSource: PAYMENT_METHOD_LOGOS.visa },
]

export default function Add() {
  const router = useRouter();
  const { colors } = useColors();

  // Handle Option Press
  const handleOptionPress = (type: string) => {
    if (type === 'Debit/Credit Card') {
      router.push('/tenant/payment/saved-methods/card-form');
      return;
    }

    router.push(`/tenant/payment/saved-methods/e-wallet-redirect?method=${type}`);
  }

  const renderPaymentMethod = ({ item }: { item: PaymentMethodType }) => (
    <ListGroup.Item onPress={() => handleOptionPress(item.title)}>
      <ListGroup.ItemPrefix>
        <Image
          source={item.logoSource}
          className='h-8 w-14'
          resizeMode='contain'
        />
      </ListGroup.ItemPrefix>

      <ListGroup.ItemContent>
        <ListGroup.ItemTitle className='font-interMedium'>
          {item.title}
        </ListGroup.ItemTitle>
      </ListGroup.ItemContent>

      <ListGroup.ItemSuffix iconProps={{ size: 20, color: colors.textPrimary }} />
    </ListGroup.Item>
  )

  const renderEmptyState = () => (
    <View className='flex-1 items-center justify-center gap-3 py-16'>
      <IconWallet size={48} color={colors.primary} />
      <Text className='text-gray-400 text-base font-inter text-center px-8'>
        No payment methods available right now.
      </Text>
    </View>
  )

  return (
    <ScreenWrapper
      className='p-5'
      header={
        <StandardHeader title='Add Payment Method' />
      }
    >
      <Text className='text-foreground text-sm font-interMedium'>
        Select a payment method type to add. You can add credit/debit cards or link your e-wallet accounts for faster rent payments.
      </Text>

      <ListGroup className='shadow-none border border-border mt-5'>
        <FlatList
          data={PAYMENT_METHOD_TYPES}
          renderItem={renderPaymentMethod}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <Separator className='mx-4' />}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        />
      </ListGroup>
    </ScreenWrapper>
  )
}
