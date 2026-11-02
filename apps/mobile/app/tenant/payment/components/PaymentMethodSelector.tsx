import { View, Text, type ImageSourcePropType } from 'react-native'
import { type ReactNode } from 'react'
import { IconBuildingBank, IconCash } from '@tabler/icons-react-native'
import { Button, Card, Spinner } from 'heroui-native'
import PaymentMethodButton from './PaymentMethodButton'
import { PAYMENT_METHOD_LOGOS } from '@/constants/images'
import CashPaymentForm, { type CashPaymentErrors } from './CashPaymentForm'
import BankTransferPicker from './BankTransferPicker'
import type { BankCode } from '@repo/constants'
import { paymentMethodLabel, type PaymentMethod } from '@repo/utils'
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
  cashPaymentDate: Date | null
  onCashPaymentDateChange: (date: Date) => void
  cashErrors?: CashPaymentErrors
  // Methods the landlord accepts; the others are not offered. Nothing is listed until the
  // list has loaded, and a failed load shows a retry instead of guessing.
  acceptedMethods: PaymentMethod[]
  methodsLoading: boolean
  methodsError: string | null
  onRetryMethods: () => void
  amount: number
  selectedBank: BankCode | null
  onBankChange: (bank: BankCode) => void
  bankError?: string
}

export default function PaymentMethodSelector({
  selectedMethod,
  onPaymentMethodChange,
  cashPaymentDate,
  onCashPaymentDateChange,
  cashErrors,
  acceptedMethods,
  methodsLoading,
  methodsError,
  onRetryMethods,
  amount,
  selectedBank,
  onBankChange,
  bankError,
}: PaymentMethodSelectorProps) {
  const offered = Object.values(METHODS).filter((entry) => acceptedMethods.includes(entry.method))

  return (
    <View>
      <View className='flex mb-3 gap-2'>
        <Text className='text-accent text-lg font-nunitoSemiBold'>
          Choose Payment Method
        </Text>
        <Text className='text-gray-500 text-base font-inter'>
          Select how you&apos;d like to pay this month&apos;s rent.
        </Text>
      </View>

      <Card className='shadow-none rounded-3xl'>
        <Card.Body>
          {methodsLoading && <View className='flex-row items-center gap-2'>
            <Spinner size='sm' accessibilityLabel='Loading payment methods' />
            <Text className='text-muted text-sm font-inter'>Loading payment methods…</Text>
          </View>}
          {methodsError && <View className='gap-2'>
            <Text accessibilityRole='alert' className='text-danger text-sm font-inter'>{methodsError}</Text>
            <Button variant='tertiary' size='sm' onPress={onRetryMethods}><Button.Label>Retry</Button.Label></Button>
          </View>}
          {offered.length > 0 && (
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {offered.map((method) => (
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
          )}

          {selectedMethod === 'Bank Transfer' && (
            <BankTransferPicker
              amount={amount}
              selectedBank={selectedBank}
              onBankChange={onBankChange}
              error={bankError}
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
