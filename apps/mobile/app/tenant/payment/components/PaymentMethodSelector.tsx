import { View, Text } from 'react-native'
import { useState, type ReactNode } from 'react'
import { IconCash } from '@tabler/icons-react-native'
import { Card, Separator } from 'heroui-native'
import PaymentMethodButton from './PaymentMethodButton'
import { PAYMENT_METHOD_LOGOS } from '@/constants/images'
import CardPaymentForm, { type CardInformation } from './CardPaymentForm'
import CashPaymentForm, { type CashPaymentErrors } from './CashPaymentForm'
import { type CardFormErrors } from '@repo/utils'

export type PaymentMethod = 'GCash' | 'Maya' | 'Debit/Credit-Card' | 'Cash'

type SelectedPaymentMethod =
  | { kind: 'saved'; id: string; method: PaymentMethod }
  | { kind: 'new'; method: PaymentMethod }
  | null

type SavedPaymentMethod = {
  id: string
  method: PaymentMethod
  label: string
  imageSource: any
}

const getSelectedMethod = (selected: SelectedPaymentMethod): PaymentMethod | null =>
  selected ? selected.method : null

const METHODS: Record<string, {
  method: PaymentMethod
  label?: string
  imageSource?: any
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
  onPaymentMethodChange: (method: PaymentMethod | null) => void
  cardInformation: CardInformation
  onCardInformationChange: (patch: Partial<CardInformation>) => void
  cardErrors?: CardFormErrors
  cashPaymentDate: Date | null
  onCashPaymentDateChange: (date: Date) => void
  cashAmountPaid: string
  onCashAmountPaidChange: (value: string) => void
  cashErrors?: CashPaymentErrors
}

// TODO: Implement saved payment methods functionality
const SAVED_PAYMENT_METHODS: SavedPaymentMethod[] = [
  { id: 'saved-gcash', method: 'GCash', label: 'GCash', imageSource: PAYMENT_METHOD_LOGOS.gcash },
  { id: 'saved-maya', method: 'Maya', label: 'Maya', imageSource: PAYMENT_METHOD_LOGOS.maya },
  { id: 'saved-visa', method: 'Debit/Credit-Card', label: 'Visa •• 4242', imageSource: PAYMENT_METHOD_LOGOS.visa },
  { id: 'saved-mc', method: 'Debit/Credit-Card', label: 'Mastercard •• 1234', imageSource: PAYMENT_METHOD_LOGOS.mastercard },
]

export default function PaymentMethodSelector({
  onPaymentMethodChange,
  cardInformation,
  onCardInformationChange,
  cardErrors,
  cashPaymentDate,
  onCashPaymentDateChange,
  cashAmountPaid,
  onCashAmountPaidChange,
  cashErrors,
}: PaymentMethodSelectorProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<SelectedPaymentMethod>(null)
  const [hasSavedPaymentMethod] = useState(false)

  const isNewMethodSelected = (method: PaymentMethod) =>
    selectedPaymentMethod?.kind === 'new' && selectedPaymentMethod.method === method

  const isSavedSelected = (id: string) =>
    selectedPaymentMethod?.kind === 'saved' && selectedPaymentMethod.id === id

  const selectNewMethod = (method: PaymentMethod) => {
    setSelectedPaymentMethod({ kind: 'new', method })
    onPaymentMethodChange(method)
  }

  const selectSavedMethod = (m: SavedPaymentMethod) => {
    setSelectedPaymentMethod({ kind: 'saved', id: m.id, method: m.method })
    onPaymentMethodChange(m.method)
  }

  const activeMethod = getSelectedMethod(selectedPaymentMethod)
  const shouldShowCardForm =
    selectedPaymentMethod?.kind === 'new' && activeMethod === 'Debit/Credit-Card'
  const shouldShowCashForm =
    selectedPaymentMethod?.kind === 'new' && activeMethod === 'Cash'

  return (
    <View>
      <View className='flex mb-3'>
        <Text className='text-accent text-lg font-interSemiBold'>
          Choose Payment Method
        </Text>
        <Text className='text-gray-500 text-base font-inter'>
          Select how you&apos;d like to pay this month&apos;s rent.
        </Text>
      </View>

      <Card className='shadow-none rounded-3xl'>
        <Card.Body>
          {hasSavedPaymentMethod && (
            <View className='flex mb-2'>
              <Text className='text-foreground text-base font-interMedium mb-3'>
                Saved
              </Text>
              <View className='flex-row flex-wrap gap-2'>
                {SAVED_PAYMENT_METHODS.map((m) => (
                  <PaymentMethodButton
                    key={m.id}
                    variant='chip'
                    imageSource={m.imageSource}
                    label={m.label}
                    selected={isSavedSelected(m.id)}
                    onPress={() => selectSavedMethod(m)}
                  />
                ))}
              </View>
            </View>
          )}

          {hasSavedPaymentMethod && <Separator className='my-4' />}

          <View className='flex'>
            <Text className='text-foreground text-base font-interMedium mb-3'>
              {hasSavedPaymentMethod ? 'Or use a new method' : 'Use a new method'}
            </Text>

            <View className="flex-row flex-wrap justify-between gap-y-3">
              {Object.values(METHODS).map((method) => (
                <PaymentMethodButton
                  key={method.method}
                  variant='tile'
                  imageSource={method.imageSource}
                  icon={method.icon}
                  label={method.label}
                  selected={isNewMethodSelected(method.method)}
                  onPress={() => selectNewMethod(method.method)}
                />
              ))}
            </View>
          </View>

          {shouldShowCardForm && (
            <CardPaymentForm
              value={cardInformation}
              onChange={onCardInformationChange}
              errors={cardErrors}
            />
          )}

          {shouldShowCashForm && (
            <CashPaymentForm
              paymentDate={cashPaymentDate}
              onPaymentDateChange={onCashPaymentDateChange}
              amountPaid={cashAmountPaid}
              onAmountPaidChange={onCashAmountPaidChange}
              errors={cashErrors}
            />
          )}
        </Card.Body>
      </Card>
    </View>
  )
}
