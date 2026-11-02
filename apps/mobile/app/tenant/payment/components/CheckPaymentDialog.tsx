import { useCallback, useEffect, useRef, useState } from 'react'
import { Linking, Text, View } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'
import { Button, Spinner } from 'heroui-native'

import AppDialog from '@/components/display/AppDialog'
import {
  cancelCheckoutSession,
  getCheckoutSessionDetails,
  NETWORK_ERROR_CODE,
  PaymongoError,
  type PaymongoSessionStatus,
} from '@/service/payments/paymongoService'

type Phase =
  | { kind: 'checking' }
  // Still open at PayMongo and unpaid: the tenant can resume, re-check or cancel it.
  | { kind: 'open'; checkoutUrl: string | null }
  | { kind: 'closed'; title: string; message: string }
  | { kind: 'error'; title: string; message: string }

interface CheckPaymentDialogProps {
  /** The payment's reference (`APT-XXXXXXXX`). The dialog checks it each time it opens. */
  referenceId: string | null
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  /** PayMongo reports the payment as paid: show its receipt. */
  onPaid: (referenceId: string) => void
}

const CLOSED_COPY: Record<'cancelled' | 'failed' | 'expired', { title: string; message: string }> = {
  cancelled: { title: 'Payment cancelled', message: 'You were not charged. You can pay again whenever you are ready.' },
  failed: { title: 'Payment not completed', message: 'Your payment was declined or cancelled. You were not charged. Please try again.' },
  expired: { title: 'Payment expired', message: 'This payment session has expired and nothing was charged. Please start a new payment.' },
}

// Asks the backend what happened to an unfinished online payment and lets the tenant act on it
// without leaving the checkout. PayMongo's answer (never the tenant's) decides the outcome.
export default function CheckPaymentDialog({ referenceId, isOpen, onOpenChange, onPaid }: CheckPaymentDialogProps) {
  const queryClient = useQueryClient()
  const [phase, setPhase] = useState<Phase>({ kind: 'checking' })
  const busyRef = useRef(false)
  // The parent recreates its callbacks on every render; reading them through a ref keeps the
  // check from re-running (and looping, since every check refreshes the parent's data).
  const callbacksRef = useRef({ onOpenChange, onPaid })
  useEffect(() => { callbacksRef.current = { onOpenChange, onPaid } })

  const run = useCallback(
    async (reference: string, cancel: boolean) => {
      if (busyRef.current) return
      busyRef.current = true
      setPhase({ kind: 'checking' })
      try {
        let status: PaymongoSessionStatus
        let checkoutUrl: string | null = null
        if (cancel) {
          status = await cancelCheckoutSession(reference)
        } else {
          const details = await getCheckoutSessionDetails(reference)
          status = details.status
          checkoutUrl = details.checkoutUrl
        }

        if (status === 'paid') {
          callbacksRef.current.onOpenChange(false)
          callbacksRef.current.onPaid(reference)
        } else if (status === 'failed') {
          setPhase({ kind: 'closed', ...(cancel ? CLOSED_COPY.cancelled : CLOSED_COPY.failed) })
        } else if (status === 'expired') {
          setPhase({ kind: 'closed', ...(cancel ? CLOSED_COPY.cancelled : CLOSED_COPY.expired) })
        } else {
          setPhase({ kind: 'open', checkoutUrl })
        }
      } catch (error) {
        setPhase({
          kind: 'error',
          title: error instanceof PaymongoError && error.code === NETWORK_ERROR_CODE ? 'Connection problem' : 'Could not check your payment',
          message: error instanceof PaymongoError ? error.reason : 'We could not confirm your payment. Please try again.',
        })
      } finally {
        busyRef.current = false
        // The check may have closed the attempt: refresh the lists that show it.
        void queryClient.invalidateQueries({ queryKey: ['payments'] })
        void queryClient.invalidateQueries({ queryKey: ['tenancy'] })
      }
    },
    [queryClient],
  )

  useEffect(() => {
    if (!isOpen || !referenceId) return
    queueMicrotask(() => { void run(referenceId, false) })
    // The next open starts from the loading state, never the previous result.
    return () => setPhase({ kind: 'checking' })
  }, [isOpen, referenceId, run])

  const title =
    phase.kind === 'checking' ? 'Checking your payment…'
      : phase.kind === 'open' ? 'Payment not completed yet'
        : phase.title

  const footer =
    phase.kind === 'open' ? (
      <View className="gap-3">
        {phase.checkoutUrl ? (
          <Button onPress={() => { void Linking.openURL(phase.checkoutUrl as string) }}>
            <Button.Label>Continue checkout</Button.Label>
          </Button>
        ) : null}
        <Button variant="secondary" onPress={() => { if (referenceId) void run(referenceId, false) }}>
          <Button.Label>Check again</Button.Label>
        </Button>
        <Button variant="tertiary" onPress={() => { if (referenceId) void run(referenceId, true) }}>
          <Button.Label>Cancel payment</Button.Label>
        </Button>
      </View>
    ) : phase.kind === 'closed' ? (
      <Button onPress={() => onOpenChange(false)}><Button.Label>Close</Button.Label></Button>
    ) : phase.kind === 'error' ? (
      <View className="gap-3">
        <Button onPress={() => { if (referenceId) void run(referenceId, false) }}><Button.Label>Try again</Button.Label></Button>
        <Button variant="tertiary" onPress={() => onOpenChange(false)}><Button.Label>Close</Button.Label></Button>
      </View>
    ) : null

  return (
    <AppDialog isOpen={isOpen} onOpenChange={onOpenChange} title={title} footer={footer}>
      {phase.kind === 'checking' ? (
        <View className="flex-row items-center gap-3">
          <Spinner size="sm" accessibilityLabel="Checking your payment" />
          <Text className="text-muted font-inter text-base">Asking PayMongo for the latest status.</Text>
        </View>
      ) : phase.kind === 'open' ? (
        <Text className="text-foreground font-inter text-base">
          Your checkout is still open and nothing has been charged. Continue it, check again, or cancel it to start over.
        </Text>
      ) : (
        <Text className={`font-inter text-base ${phase.kind === 'error' ? 'text-danger' : 'text-foreground'}`}>{phase.message}</Text>
      )}
    </AppDialog>
  )
}
