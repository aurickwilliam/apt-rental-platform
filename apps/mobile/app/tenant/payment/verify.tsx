import { View, Text, Linking } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Spinner } from 'heroui-native'

import ErrorDialog from '@/components/display/ErrorDialog'
import {
  cancelCheckoutSession,
  getCheckoutSessionDetails,
  PaymongoError,
  type PaymongoSessionStatus,
} from '@/service/payments/paymongoService'

export default function PaymentVerify() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { sessionId, referenceId, cancelled } = useLocalSearchParams<{
    sessionId?: string
    referenceId?: string
    cancelled?: string
  }>()
  // Set by the checkout's cancel link (the back arrow). Only picks the screen:
  // the backend still decides what happened to the payment.
  const backedOut = cancelled === '1'

  const [isVerifying, setIsVerifying] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isCancelled, setIsCancelled] = useState(false)
  // Still open at PayMongo and unpaid: the tenant can resume or cancel it.
  const [isPending, setIsPending] = useState(false)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const verifyingRef = useRef(false)

  // `cancel` asks the backend to close the session first; either way its
  // verdict (never the link) decides what the tenant sees.
  const verifyPayment = useCallback(
    async (sessionIdValue: string, cancel: boolean) => {
      if (verifyingRef.current) return
      verifyingRef.current = true
      setIsVerifying(true)
      setErrorMessage(null)
      setIsPending(false)

      try {
        let status: PaymongoSessionStatus
        let resumeUrl: string | null = null
        if (cancel) {
          status = await cancelCheckoutSession(sessionIdValue)
        } else {
          const details = await getCheckoutSessionDetails(sessionIdValue)
          status = details.status
          resumeUrl = details.checkoutUrl
        }

        if (status === 'paid') {
          const successReferenceId =
            typeof referenceId === 'string' && referenceId ? referenceId : sessionIdValue.replace(/^cs_sim_/, '').replace(/^cs_/, '')
          router.replace(`/tenant/payment/success?referenceId=${successReferenceId}`)
          return
        }

        if (cancel && (status === 'failed' || status === 'expired')) {
          setIsCancelled(true)
        } else if (status === 'failed') {
          setErrorMessage('Your payment was declined or cancelled. Please try again.')
        } else if (status === 'expired') {
          setErrorMessage('This payment session has expired. Please start a new payment.')
        } else {
          setCheckoutUrl(resumeUrl)
          setIsPending(true)
        }
      } catch (error) {
        setErrorMessage(error instanceof PaymongoError ? error.reason : 'We could not confirm your payment. Please try again.')
      } finally {
        verifyingRef.current = false
        setIsVerifying(false)
      }
    },
    [router, referenceId]
  )

  useEffect(() => {
    if (typeof sessionId === 'string' && sessionId.length > 0) {
      const pendingId = sessionId;
      queueMicrotask(() => {
        void verifyPayment(pendingId, backedOut);
      });
    } else {
      queueMicrotask(() => {
        setIsVerifying(false)
        setErrorMessage('Missing payment session. Please start a new payment.')
      });
    }
  }, [sessionId, backedOut, verifyPayment])

  const handleRetry = () => {
    if (typeof sessionId === 'string') void verifyPayment(sessionId, false)
  }

  const handleCancelPayment = () => {
    if (typeof sessionId === 'string') void verifyPayment(sessionId, true)
  }

  const handleContinueCheckout = () => {
    if (checkoutUrl) void Linking.openURL(checkoutUrl)
  }

  const handleGoBack = () => {
    router.replace('/tenant/payment')
  }

  return (
    <View
      className="flex-1 bg-primary items-center justify-center px-5"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {isVerifying ? (
        <>
          <Spinner size="lg" color="#FFFFFF" />
          <Text className="text-white mt-4 font-inter text-base">Verifying payment...</Text>
        </>
      ) : isCancelled ? (
        <View className="items-center gap-4">
          <Text className="text-white text-center text-lg font-nunitoSemiBold">Payment cancelled</Text>
          <Text className="text-white text-center text-base font-inter">You were not charged. You can pay again whenever you are ready.</Text>
          <Button variant="secondary" size="sm" onPress={handleGoBack} className="bg-white">
            <Button.Label className="text-primary">Back to payment</Button.Label>
          </Button>
        </View>
      ) : isPending ? (
        <View className="items-center gap-4">
          <Text className="text-white text-center text-lg font-nunitoSemiBold">Payment not completed yet</Text>
          <Text className="text-white text-center text-base font-inter">
            Your checkout is still open and nothing has been charged. Continue it, check again, or cancel it to start over.
          </Text>
          <View className="gap-3 self-stretch">
            {checkoutUrl ? (
              <Button variant="secondary" size="sm" onPress={handleContinueCheckout} className="bg-white">
                <Button.Label className="text-primary">Continue checkout</Button.Label>
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" onPress={handleRetry} className="border border-white">
              <Button.Label className="text-white">Check again</Button.Label>
            </Button>
            <Button variant="ghost" size="sm" onPress={handleCancelPayment} className="border border-white">
              <Button.Label className="text-white">Cancel this payment</Button.Label>
            </Button>
            <Button variant="ghost" size="sm" onPress={handleGoBack}>
              <Button.Label className="text-white">Go Back</Button.Label>
            </Button>
          </View>
        </View>
      ) : errorMessage ? (
        <View className="items-center gap-4">
          <Text className="text-white text-center text-base font-inter">{errorMessage}</Text>
          <View className="flex-row gap-3">
            <Button variant="secondary" size="sm" onPress={handleRetry} className="bg-white">
              <Button.Label className="text-primary">Try Again</Button.Label>
            </Button>
            <Button variant="ghost" size="sm" onPress={handleGoBack} className="border border-white">
              <Button.Label className="text-white">Go Back</Button.Label>
            </Button>
          </View>
        </View>
      ) : null}

      <ErrorDialog isOpen={errorMessage !== null} onClose={() => setErrorMessage(null)} message={errorMessage ?? ''} title="Payment Failed" />
    </View>
  )
}
