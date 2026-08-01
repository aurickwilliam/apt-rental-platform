import { View, Text, Image } from 'react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as Linking from 'expo-linking'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import ErrorDialog from '@/components/display/ErrorDialog'
import PillButton from '@/components/buttons/PillButton'

import { PAYMENT_METHOD_LOGOS } from '@/constants/images'

import {
  getCheckoutSessionStatus,
  PaymongoError,
} from '@/service/paymongoService'

export default function EWalletRedirect() {
  const { method, sessionId, checkoutUrl } = useLocalSearchParams();
  const router = useRouter();

  const [hasLaunched, setHasLaunched] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const verifyingRef = useRef(false);

  const imageSource = method === 'gcash' ? PAYMENT_METHOD_LOGOS.gcashBig : PAYMENT_METHOD_LOGOS.mayaBig;
  const methodText = method === 'gcash' ? 'GCash' : 'Maya';
  const connectLabel = method === 'gcash' ? 'Connect to GCash' : 'Connect to Maya';

  const verifyPayment = useCallback(async (sessionIdValue: string) => {
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    setIsVerifying(true);
    setErrorMessage(null);

    try {
      // The backend is the source of truth for the payment outcome. The deep
      // link only identifies the session — any result=success|failed params are
      // intentionally ignored and never trusted here.
      const paymentStatus = await getCheckoutSessionStatus(sessionIdValue);

      if (paymentStatus === 'paid') {
        // TODO: Record payment in payment_history
        // TODO: Update tenant rent status
        // TODO: Generate receipt
        // TODO: Send landlord and tenant notifications
        // TODO: Store PayMongo payment reference
        router.replace('/tenant/payment/success');
        return;
      }

      if (paymentStatus === 'failed') {
        setErrorMessage('Your payment was declined or cancelled. Please try again.');
      } else if (paymentStatus === 'expired') {
        setErrorMessage('This payment session has expired. Please start a new payment.');
      } else {
        setErrorMessage('We could not confirm your payment. Please try again.');
      }
    } catch (error) {
      setErrorMessage(
        error instanceof PaymongoError
          ? error.reason
          : 'We could not confirm your payment. Please try again.'
      );
    } finally {
      verifyingRef.current = false;
      setIsVerifying(false);
    }
  }, [router]);

  // Initial launch: open the hosted PayMongo checkout page so the user can
  // authorize the payment inside the e-wallet. On deep-link return (or a cold
  // start via the deep link, where checkoutUrl is absent), verify the status
  // against the backend instead.
  useEffect(() => {
    if (typeof sessionId !== 'string') return;

    if (typeof checkoutUrl === 'string') {
      setHasLaunched(true);
      Linking.openURL(checkoutUrl).catch(() => {
        // Hosted page could not be opened (e.g. mock URL). The fallback
        // "Check Payment Status" button below still lets the user continue.
      });
    } else {
      verifyPayment(sessionId);
    }
  }, [sessionId, checkoutUrl, verifyPayment]);

  // Deep-link return handler: extracts only the session id from the URL and
  // always re-verifies with the backend. Never trusts query params like result.
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const { queryParams } = Linking.parse(event.url);
      const returnedSessionId = queryParams?.sessionId;

      if (typeof returnedSessionId === 'string' && returnedSessionId === sessionId) {
        verifyPayment(returnedSessionId);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, [sessionId, verifyPayment]);

  const handlePrimaryPress = () => {
    if (hasLaunched) {
      if (typeof sessionId === 'string') verifyPayment(sessionId);
      return;
    }
    if (typeof checkoutUrl === 'string') {
      setHasLaunched(true);
      Linking.openURL(checkoutUrl).catch(() => {});
    }
  };

  return (
    <ScreenWrapper
      header={
        <StandardHeader title='Redirecting to E-Wallet' />
      }
      className='p-5'
    >
      <View className='flex-1 items-center justify-center'>
        {/* Image of E-wallet */}
        <View className='size-48 overflow-hidden rounded-3xl'>
          <Image
            source={imageSource}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </View>

        <View className='mt-10'>
          <Text className='text-foreground text-center text-lg font-interMedium'>
            You’ll be redirected to <Text className={`font-interSemiBold ${method === 'gcash' ? 'text-primary' : 'text-success'}`}>{methodText}</Text> to authorize this payment method.
          </Text>
        </View>

        {hasLaunched && (
          <Text className='text-muted text-center text-sm font-inter mt-4'>
            {isVerifying
              ? 'Checking your payment status…'
              : 'Waiting for you to finish authorizing the payment in the e-wallet.'}
          </Text>
        )}

        <View className='mt-5 w-full'>
          <PillButton
            label={isVerifying ? 'Checking…' : hasLaunched ? 'Check Payment Status' : connectLabel}
            isFullWidth
            isDisabled={isVerifying}
            onPress={handlePrimaryPress}
          />
        </View>
      </View>

      <ErrorDialog
        isOpen={errorMessage !== null}
        onClose={() => setErrorMessage(null)}
        message={errorMessage}
        title='Payment Failed'
      />
    </ScreenWrapper>
  )
}
