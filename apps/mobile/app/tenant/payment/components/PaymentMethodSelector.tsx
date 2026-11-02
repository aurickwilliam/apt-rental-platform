import { View, Text, type ImageSourcePropType } from 'react-native'
import { type ReactNode } from 'react'
import { IconBuildingBank, IconCash, IconSettings } from '@tabler/icons-react-native'
import { Button, Card, Separator, Spinner } from 'heroui-native'
import PaymentMethodButton from './PaymentMethodButton'
import { PAYMENT_METHOD_LOGOS } from '@/constants/images'
import CardPaymentForm, { type CardInformation } from './CardPaymentForm'
import CashPaymentForm, { type CashPaymentErrors } from './CashPaymentForm'
import BankTransferPicker from './BankTransferPicker'
import type { BankCode } from '@repo/constants'
import { paymentMethodLabel, type CardFormErrors, type PaymentMethod, type PaymentMethodPreference } from '@repo/utils'
import { useColors } from '@/hooks/useTheme'
export type { PaymentMethod } from '@repo/utils'

const METHODS: Record<PaymentMethod, {
  method: PaymentMethod
  label?: string
  imageSource?: ImageSourcePropType
  icon?: ReactNode
}> = {
  GCash: {
    method: 'GCash',
    imageSource: PAYMENT_METHOD_LOGOS.gcashBig,
  },
  Maya: {
    method: 'Maya',
    imageSource: PAYMENT_METHOD_LOGOS.mayaBig,
  },
  QRPh: {
    method: 'QRPh',
    imageSource: PAYMENT_METHOD_LOGOS.qrphBig,
  },
  'Bank Transfer': {
    method: 'Bank Transfer',
    label: 'Bank Transfer',
    icon: <IconBuildingBank size={30} color='#4F46E5' />,
  },
  'Debit/Credit-Card': {
    method: 'Debit/Credit-Card',
    label: 'Debit/Credit Card',
    imageSource: PAYMENT_METHOD_LOGOS.visa,
  },
  Cash: {
    method: 'Cash',
    label: 'Cash',
    icon: <IconCash size={30} color='#16a34a' />,
  },
}

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null
  onPaymentMethodChange: (method: PaymentMethod) => void
  preferences: PaymentMethodPreference
  preferencesLoading: boolean
  preferencesError: string | null
  onRetryPreferences: () => void
  onManagePreferences: () => void
  cardInformation: CardInformation
  onCardInformationChange: (patch: Partial<CardInformation>) => void
  cardErrors?: CardFormErrors
  cashPaymentDate: Date | null
  onCashPaymentDateChange: (date: Date) => void
  cashErrors?: CashPaymentErrors
  // Methods the landlord accepts; the others are not offered.
  acceptedMethods: PaymentMethod[]
  amount: number
  selectedBank: BankCode | null
  onBankChange: (bank: BankCode) => void
  bankError?: string
}

export default function PaymentMethodSelector({
  selectedMethod,
  preferences,
  preferencesLoading,
  preferencesError,
  onRetryPreferences,
  onManagePreferences,
  onPaymentMethodChange,
  cardInformation,
  onCardInformationChange,
  cardErrors,
  cashPaymentDate,
  onCashPaymentDateChange,
  cashErrors,
  acceptedMethods,
  amount,
  selectedBank,
  onBankChange,
  bankError,
}: PaymentMethodSelectorProps) {
  const { colors } = useColors()
  const savedMethods = preferences.savedMethods.filter((method) => acceptedMethods.includes(method))
  const otherMethods = Object.values(METHODS).filter(
    (entry) => acceptedMethods.includes(entry.method) && !savedMethods.includes(entry.method),
  )

  return (
    <View>
      <View className='flex mb-3 gap-2'>
        <Text className='text-accent text-lg font-nunitoSemiBold'>
          Choose Payment Method
        </Text>
        <Text className='text-gray-500 text-base font-inter'>
          Select how you&apos;d like to pay this month&apos;s rent.
        </Text>
        <Button variant='secondary' size='sm' onPress={onManagePreferences} className='self-start'>
          <IconSettings size={16} color={colors.primary} />
          <Button.Label>Manage preferences</Button.Label>
        </Button>
      </View>

      <Card className='shadow-none rounded-3xl'>
        <Card.Body>
          {savedMethods.length > 0 && (
            <View className='flex mb-2'>
              <Text className='text-foreground text-base font-nunitoSemiBold mb-3'>
                Preferred payment
              </Text>
              <View className='flex-row flex-wrap justify-between gap-y-3'>
                {savedMethods.map((method) => (
                  <PaymentMethodButton
                    key={method}
                    variant='tile'
                    imageSource={METHODS[method].imageSource}
                    icon={METHODS[method].icon}
                    label={paymentMethodLabel(method)}
                    badge={preferences.defaultMethod === method ? 'Default' : undefined}
                    accessibilityLabel={`${paymentMethodLabel(method)}${preferences.defaultMethod === method ? ', default' : ''}`}
                    selected={selectedMethod === method}
                    onPress={() => onPaymentMethodChange(method)}
                  />
                ))}
              </View>
            </View>
          )}

          {preferencesLoading && <View className='flex-row items-center gap-2 mb-3'>
            <Spinner size='sm' accessibilityLabel='Loading payment preferences' />
            <Text className='text-muted text-sm font-inter'>Loading preferences…</Text>
          </View>}
          {preferencesError && <View className='gap-2 mb-3'>
            <Text accessibilityRole='alert' className='text-danger text-sm font-inter'>{preferencesError}</Text>
            <Button variant='tertiary' size='sm' onPress={onRetryPreferences}><Button.Label>Retry preferences</Button.Label></Button>
          </View>}
          {!preferencesLoading && !preferencesError && savedMethods.length === 0 && (
            <Text className='text-muted text-sm font-inter mb-3'>No preferred payment method yet. Manage preferences to choose a default.</Text>
          )}
          {savedMethods.length > 0 && otherMethods.length > 0 && <Separator className='my-4' />}

          {otherMethods.length > 0 && (
            <View className='flex'>
              <Text className='text-foreground text-base font-nunitoSemiBold mb-3'>
                {savedMethods.length > 0 ? 'Other payment methods' : 'Payment methods'}
              </Text>

              <View className="flex-row flex-wrap justify-between gap-y-3">
                {otherMethods.map((method) => (
                  <PaymentMethodButton
                    key={method.method}
                    variant='tile'
                    imageSource={method.imageSource}
                    icon={method.icon}
                    label={paymentMethodLabel(method.method)}
                    accessibilityLabel={paymentMethodLabel(method.method)}
                    selected={selectedMethod === method.method}
                    onPress={() => onPaymentMethodChange(method.method)}
                  />
                ))}
              </View>
            </View>
          )}

          {selectedMethod === 'Bank Transfer' && (
            <BankTransferPicker
              amount={amount}
              selectedBank={selectedBank}
              onBankChange={onBankChange}
              error={bankError}
            />
          )}

          {selectedMethod === 'Debit/Credit-Card' && (
            <CardPaymentForm
              value={cardInformation}
              onChange={onCardInformationChange}
              errors={cardErrors}
            />
          )}

          {selectedMethod === 'Cash' && (
            <CashPaymentForm
              paymentDate={cashPaymentDate}
              onPaymentDateChange={onCashPaymentDateChange}
              errors={cashErrors}
            />
          )}
        </Card.Body>
      </Card>
    </View>
  )
}
