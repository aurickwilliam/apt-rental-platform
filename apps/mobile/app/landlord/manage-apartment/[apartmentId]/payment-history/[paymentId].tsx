import { ScrollView, Text, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Button, Spinner } from 'heroui-native'
import { IconChevronLeft } from '@tabler/icons-react-native'
import { useQueryClient } from '@tanstack/react-query'

import { useColors } from '@/hooks/useTheme'
import { usePayment, getPaymentQueryKey } from '@/hooks/payments'
import {
  useLandlordPaymentConfirmation,
  useLandlordPaymentDecline,
  useSaveReceiptPhoto,
} from '@/hooks/landlord'
import PaymentReceipt from '@/components/landlord-payments/PaymentReceipt'
import PaymentReceiptActions from '@/components/landlord-payments/PaymentReceiptActions'

const SCREEN_PADDING = 20
const CAPTURE_FRAME = 16

// The landlord's receipt: the web's white paper on the app's blue. A copy of the paper
// without its buttons is kept off screen so Save as photo captures only the receipt.
export default function LandlordPaymentReceipt() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors } = useColors()
  const { width: windowWidth } = useWindowDimensions()
  const queryClient = useQueryClient()
  const { apartmentId, paymentId } = useLocalSearchParams<{
    apartmentId: string
    paymentId: string
  }>()

  const paymentQuery = usePayment(paymentId ?? null)
  const payment = paymentQuery.data

  const confirmMutation = useLandlordPaymentConfirmation(apartmentId)
  const declineMutation = useLandlordPaymentDecline(apartmentId)
  const isBusy = confirmMutation.isPending || declineMutation.isPending
  const failure = confirmMutation.error ?? declineMutation.error
  const errorMessage = failure ? (failure as Error).message || 'Could not update payment.' : null
  const { receiptRef, save: savePhoto } = useSaveReceiptPhoto()

  const resolve = (mutation: typeof confirmMutation, status: 'paid' | 'rejected') => {
    if (!paymentId) return
    mutation.mutate(paymentId, {
      onSuccess: () => {
        // The buttons go as soon as the cached status changes, so a quick second tap
        // can't hit a payment that is already settled while the refetch is in flight.
        queryClient.setQueryData(getPaymentQueryKey(paymentId), (cached: unknown) =>
          typeof cached === 'object' && cached !== null ? { ...cached, status } : cached
        )
        void queryClient.invalidateQueries({ queryKey: getPaymentQueryKey(paymentId) })
      },
    })
  }

  const clearError = () => {
    confirmMutation.reset()
    declineMutation.reset()
  }

  return (
    <View className='flex-1 bg-primary' style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className='px-5 pt-2'>
        <Button onPress={() => router.back()} variant='ghost' isIconOnly className='bg-white/20 self-start' accessibilityLabel='Back'>
          <IconChevronLeft size={24} color='#FFFFFF' />
        </Button>
      </View>

      {payment ? (
        <>
          <ScrollView
            className='flex-1'
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: SCREEN_PADDING }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps='handled'
          >
            <PaymentReceipt
              payment={payment}
              footer={
                <PaymentReceiptActions
                  payment={payment}
                  isBusy={isBusy}
                  error={errorMessage}
                  onConfirm={() => resolve(confirmMutation, 'paid')}
                  onDecline={() => resolve(declineMutation, 'rejected')}
                  onClearError={clearError}
                  onSavePhoto={savePhoto}
                />
              }
            />
          </ScrollView>

          <View
            ref={receiptRef}
            collapsable={false}
            pointerEvents='none'
            accessibilityElementsHidden
            importantForAccessibility='no-hide-descendants'
            style={{
              position: 'absolute',
              left: -10000,
              top: 0,
              width: windowWidth - SCREEN_PADDING * 2 + CAPTURE_FRAME * 2,
              padding: CAPTURE_FRAME,
              backgroundColor: colors.primary,
            }}
          >
            <PaymentReceipt payment={payment} footer={null} />
          </View>
        </>
      ) : (
        <View className='flex-1 items-center justify-center gap-4 px-5'>
          {paymentQuery.isLoading ? (
            <Spinner size='lg' color='#FFFFFF' accessibilityLabel='Loading receipt' />
          ) : (
            <>
              <Text className='text-white text-base font-inter text-center'>
                {paymentQuery.error ? 'We could not load this receipt.' : 'We could not find this payment.'}
              </Text>
              <Button
                onPress={() => {
                  if (paymentQuery.error) void paymentQuery.refetch()
                  else router.back()
                }}
                className='bg-white'
              >
                <Button.Label className='text-primary'>{paymentQuery.error ? 'Try Again' : 'Go Back'}</Button.Label>
              </Button>
            </>
          )}
        </View>
      )}
    </View>
  )
}
