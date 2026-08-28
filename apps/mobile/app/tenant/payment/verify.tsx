import { View, Text } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, Spinner } from 'heroui-native'

import ErrorDialog from '@/components/display/ErrorDialog'
import { getCheckoutSessionStatus, PaymongoError } from '@/service/payments/paymongoService'

export default function PaymentVerify() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { sessionId, referenceId } = useLocalSearchParams<{
    sessionId?: string
    referenceId?: string
  }>()

  const [isVerifying, setIsVerifying] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const verifyingRef = useRef(false)

  const verifyPayment = useCallback(
    async (sessionIdValue: string) => {
      if (verifyingRef.current) return
      verifyingRef.current = true
      setIsVerifying(true)
      setErrorMessage(null)

      try {
        const status = await getCheckoutSessionStatus(sessionIdValue)

        if (status === 'paid') {
          const successReferenceId =
            typeof referenceId === 'string' && referenceId ? referenceId : sessionIdValue.replace(/^cs_sim_/, '').replace(/^cs_/, '')
          router.replace(`/tenant/payment/success?referenceId=${successReferenceId}`)
          return
        }

        if (status === 'failed') {
          setErrorMessage('Your payment was declined or cancelled. Please try again.')
        } else if (status === 'expired') {
          setErrorMessage('This payment session has expired. Please start a new payment.')
        } else {
          setErrorMessage('We could not confirm your payment yet. Please try again.')
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
      void verifyPayment(sessionId)
    } else {
      setIsVerifying(false)
      setErrorMessage('Missing payment session. Please start a new payment.')
    }
  }, [sessionId, verifyPayment])

  const handleRetry = () => {
    if (typeof sessionId === 'string') void verifyPayment(sessionId)
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
