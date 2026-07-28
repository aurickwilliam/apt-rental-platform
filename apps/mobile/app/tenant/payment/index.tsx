import { View, Text } from 'react-native'
import { useState, type ReactNode } from 'react'
import { useRouter } from 'expo-router'

import { IconCash } from '@tabler/icons-react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import DetailField from '@/components/display/DetailField'
import PaymentMethodButton from './components/PaymentMethodButton'
import DateTimeField from '@/components/inputs/DateField'

import { PAYMENT_METHOD_LOGOS } from '@/constants/images'

import { formatPesoDisplay } from '@repo/utils'

import {
  Separator,
  Card,
  Button,
  TextField,
  Input,
  Label,
  FieldError,
  Description,
  Checkbox,
  ControlField
} from 'heroui-native'

type PaymentMethod = 'GCash' | 'Maya' | 'Debit/Credit-Card' | 'Cash';

type SelectedPaymentMethod =
  | { kind: 'saved'; id: string; method: PaymentMethod }
  | { kind: 'new'; method: PaymentMethod }
  | null;

type SavedPaymentMethod = {
  id: string;
  method: PaymentMethod;
  label: string;
  imageSource: any;
}

type CardInformation = {
  cardNumber: string;
  expiryDate: Date;
  cardholderName: string;
  cvv: string;
  isPaymentSaved: boolean;
  isCardNumberValid?: boolean;
}

const getSelectedMethod = (selected: SelectedPaymentMethod): PaymentMethod | null =>
  selected ? selected.method : null;

const sanitizeDecimalInput = (value: string): string => {
  let filtered = value.replace(/[^0-9.]/g, '');

  const parts = filtered.split('.');
  if (parts.length > 2) {
    filtered = parts[0] + '.' + parts.slice(1).join('');
  }

  if (filtered.includes('.')) {
    const [int, dec] = filtered.split('.');
    filtered = dec.length > 2 ? `${int}.${dec.slice(0, 2)}` : filtered;
  }

  return filtered;
};

const METHODS: Record<string, {
  method: PaymentMethod;
  label: string;
  imageSource?: any;
  icon?: ReactNode;
}> = {
  GCash: {
    method: 'GCash',
    label: 'GCash',
    imageSource: PAYMENT_METHOD_LOGOS.gcash
  },
  Maya: {
    method: 'Maya',
    label: 'Maya',
    imageSource: PAYMENT_METHOD_LOGOS.maya
  },
  'Debit/Credit-Card': {
    method: 'Debit/Credit-Card',
    label: 'Debit/Credit Card',
    imageSource: PAYMENT_METHOD_LOGOS.visa
  },
  Cash: {
    method: 'Cash',
    label: 'Cash',
    icon: <IconCash size={30} color='#16a34a' />
  },
};

export default function PaymentCheckout() {
  const router = useRouter();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<SelectedPaymentMethod>(null);
  const [hasSavedPaymentMethod] = useState(false);

  // TODO: Replace with data from API once wired up.
  const savedPaymentMethods: SavedPaymentMethod[] = [
    { id: 'saved-gcash', method: 'GCash', label: 'GCash', imageSource: PAYMENT_METHOD_LOGOS.gcash },
    { id: 'saved-maya', method: 'Maya', label: 'Maya', imageSource: PAYMENT_METHOD_LOGOS.maya },
    { id: 'saved-visa', method: 'Debit/Credit-Card', label: 'Visa •• 4242', imageSource: PAYMENT_METHOD_LOGOS.visa },
    { id: 'saved-mc', method: 'Debit/Credit-Card', label: 'Mastercard •• 1234', imageSource: PAYMENT_METHOD_LOGOS.mastercard },
  ];

  const [cardInformation, setCardInformation] = useState<CardInformation>({
    cardNumber: '',
    expiryDate: new Date(),
    cardholderName: '',
    cvv: '',
    isPaymentSaved: false,
    isCardNumberValid: false,
  })

  const [amountPaid, setAmountPaid] = useState('');

  // TODO: Fetch apartment details and rent payment information from API and display here. For now, we will use dummy data.
  const apartmentDetails = {
    name: 'Sunny Apartments',
    address: '123 Main St, City, State',
    landlord: 'John Doe',
    leaseStart: '01/01/2024',
    leaseEnd: '12/31/2024',
    month: 'October',
    year: '2024',
    monthlyRent: 1_200.00,
    dueDate: '10/05/2024',
    paymentStatus: 'Unpaid',
    paidAmount: 0.00,
  }

  const totalPayment = apartmentDetails.monthlyRent - apartmentDetails.paidAmount;

  const handlePay = () => {
    const method = getSelectedMethod(selectedPaymentMethod);

    if (method === 'GCash') {
      router.push('/tenant/payment/e-wallet-redirect?method=gcash');
      return;
    }
    else if (method === 'Maya') {
      router.push('/tenant/payment/e-wallet-redirect?method=maya');
      return;
    }

    router.push('/tenant/payment/success');
  }

  const handleCardNumberChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 19);
    const formatted = digitsOnly.replace(/(.{4})/g, '$1 ').trim();

    const luhnCheck = (cardNumber: string): boolean => {
      let sum = 0;
      let shouldDouble = false;

      for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber.charAt(i), 10);
        if (Number.isNaN(digit)) {
          return false;
        }

        if (shouldDouble) {
          digit *= 2;
          if (digit > 9) {
            digit -= 9;
          }
        }

        sum += digit;
        shouldDouble = !shouldDouble;
      }

      return sum % 10 === 0;
    };

    const isValidLength = digitsOnly.length >= 13 && digitsOnly.length <= 19;
    const isLuhnValid = isValidLength ? luhnCheck(digitsOnly) : false;

    setCardInformation({
      ...cardInformation,
      cardNumber: formatted,
      isCardNumberValid: isLuhnValid,
    });
  }

  const isNewMethodSelected = (method: PaymentMethod) =>
    selectedPaymentMethod?.kind === 'new' && selectedPaymentMethod.method === method;

  const isSavedSelected = (id: string) =>
    selectedPaymentMethod?.kind === 'saved' && selectedPaymentMethod.id === id;

  const selectNewMethod = (method: PaymentMethod) =>
    setSelectedPaymentMethod({ kind: 'new', method });

  const selectSavedMethod = (m: SavedPaymentMethod) =>
    setSelectedPaymentMethod({ kind: 'saved', id: m.id, method: m.method });

  const activeMethod = getSelectedMethod(selectedPaymentMethod);
  const shouldShowCardForm =
    selectedPaymentMethod?.kind === 'new' && activeMethod === 'Debit/Credit-Card';
  const shouldShowCashForm =
    selectedPaymentMethod?.kind === 'new' && activeMethod === 'Cash';

  return (
    <ScreenWrapper
      scrollable
      header={
        <StandardHeader title='Rent Payment' />
      }
      footer={
        <View className='w-full p-5 border-t border-border flex-row items-center justify-between bg-surface gap-10'>
          <View className='flex'>
            <Text className='text-muted font-interMedium'>
              Total Rent Due
            </Text>
            <Text className='text-primary text-2xl font-interSemiBold'>
              {formatPesoDisplay(totalPayment)}
            </Text>
          </View>

          <Button
            onPress={handlePay}
            className='flex-1'
          >
            <Button.Label>
              Pay
            </Button.Label>
          </Button>
        </View>
      }
      className='p-5'
    >
      {/* Apartment Details */}
      <View className='flex gap-3'>
        <DetailField
          label='Apartment Name'
          value={apartmentDetails.name}
        />

        <DetailField
          label='Address'
          value={apartmentDetails.address}
        />

        <DetailField
          label='Landlord Name'
          value={apartmentDetails.landlord}
        />

        <View className='flex-row'>
          <DetailField
            label='Lease Start'
            value={apartmentDetails.leaseStart}
          />

          <DetailField
            label='Lease End'
            value={apartmentDetails.leaseEnd}
          />
        </View>
      </View>

      {/* Payment Summary */}
      <Card className='shadow-none rounded-3xl my-5'>
        <Card.Header>
          <Text className='text-accent text-lg font-interSemiBold'>
            Payment Summary
          </Text>
        </Card.Header>

        <Card.Body className='mb-5'>
          <View className='flex gap-2 mt-3'>
            <View className='flex-row justify-between items-center'>
              <Text className='text-sm text-foreground font-inter'>
                Month & Year
              </Text>
              <Text className='text-sm text-foreground font-inter'>
                {apartmentDetails.month} {apartmentDetails.year}
              </Text>
            </View>

            <View className='flex-row justify-between items-center'>
              <Text className='text-sm text-foreground font-inter'>
                Due Date
              </Text>
              <Text className='text-sm text-foreground font-inter'>
                {apartmentDetails.dueDate}
              </Text>
            </View>

            <View className='flex-row justify-between items-center'>
              <Text className='text-sm text-foreground font-inter'>
                Monthly Rent
              </Text>
              <Text className='text-sm text-foreground font-inter'>
                {formatPesoDisplay(apartmentDetails.monthlyRent)}
              </Text>
            </View>

            <View className='flex-row justify-between items-center'>
              <Text className='text-sm text-foreground font-inter'>
                Paid
              </Text>
              <Text className='text-sm text-foreground font-inter'>
                {formatPesoDisplay(apartmentDetails.paidAmount)}
              </Text>
            </View>

            <Separator className='my-3' />

            <View className='flex-row justify-between items-center'>
              <Text className='text-sm text-foreground font-inter'>
                Balance Left
              </Text>
              <Text className='text-sm text-foreground font-inter'>
                {formatPesoDisplay(totalPayment)}
              </Text>
            </View>
          </View>
        </Card.Body>

        <Card.Footer>
          <View className='flex-row justify-between items-center mt-2'>
            <Text className='text-sm text-accent font-interMedium'>
              Total Payment
            </Text>
            <Text className='text-sm text-accent font-interMedium'>
              {formatPesoDisplay(totalPayment)}
            </Text>
          </View>
        </Card.Footer>
      </Card>

      {/* Payment Method Selection */}
      <View className='flex mb-3'>
        <Text className='text-accent text-lg font-interSemiBold'>
          Choose Payment Method
        </Text>

        <Text className='text-grey-500 text-base font-inter'>
          Select how you&apos;d like to pay this month&apos;s rent.
        </Text>
      </View>

      <Card className='shadow-none rounded-3xl'>
        <Card.Body>
          {/* Saved Payment Methods */}
          {hasSavedPaymentMethod && (
            <View className='flex mb-2'>
              <Text className='text-text text-base font-interMedium mb-3'>
                Saved
              </Text>

              <View className='flex-row flex-wrap gap-2'>
                {savedPaymentMethods.map((m) => (
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

          {/* New Payment Methods (2x2 grid) */}
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

          {/* Form slot */}
          {shouldShowCardForm && (
            <View className='mt-5'>
              <Separator className='mb-5' />

              <Text className='text-foreground text-base font-interSemiBold mb-3'>
                Card Details
              </Text>

              <View className='flex gap-3'>
                <TextField
                  isRequired
                  isInvalid={cardInformation.cardNumber.length > 0 && !cardInformation.isCardNumberValid}
                >
                  <Label>Card Number:</Label>
                  <Input
                    placeholder='**** **** **** ****'
                    value={cardInformation.cardNumber}
                    maxLength={23}
                    keyboardType='number-pad'
                    variant='primary'
                    onChangeText={(value) => handleCardNumberChange(value)}
                  />
                  {cardInformation.cardNumber.length > 0 && !cardInformation.isCardNumberValid && (
                    <FieldError>Please enter a valid card number.</FieldError>
                  )}
                </TextField>

                <DateTimeField
                  label='Expiry Date:'
                  placeholder='XX/XX'
                  required
                  value={cardInformation.expiryDate}
                  onChange={(value) => setCardInformation({ ...cardInformation, expiryDate: value })}
                />

                <TextField isRequired>
                  <Label>Cardholder Name:</Label>
                  <Input
                    placeholder='Enter cardholder name'
                    value={cardInformation.cardholderName}
                    variant='primary'
                    onChangeText={(value) => setCardInformation({ ...cardInformation, cardholderName: value })}
                  />
                  <FieldError>Cardholder name is required.</FieldError>
                </TextField>

                <TextField isRequired>
                  <Label>CVV:</Label>
                  <Input
                    placeholder='***'
                    value={cardInformation.cvv}
                    maxLength={3}
                    keyboardType='number-pad'
                    variant='primary'
                    onChangeText={(value) => setCardInformation({ ...cardInformation, cvv: value.replace(/\D/g, '').slice(0, 3) })}
                  />

                  <Description>
                    3-digit code at the back of your card.
                  </Description>
                </TextField>

                <ControlField
                  isSelected={cardInformation.isPaymentSaved}
                  onSelectedChange={() =>
                    setCardInformation({ ...cardInformation, isPaymentSaved: !cardInformation.isPaymentSaved })
                  }
                  className='mt-5'
                >
                  <ControlField.Indicator>
                    <Checkbox className="size-5 border border-border shadow-none" />
                  </ControlField.Indicator>
                  <Label>
                    <Label.Text className="text-sm text-foreground font-inter">
                      Save this card for future use?
                    </Label.Text>
                  </Label>
                </ControlField>
              </View>
            </View>
          )}

          {shouldShowCashForm && (
            <View className='mt-5'>
              <Separator className='mb-5' />

              <Text className='text-foreground text-base font-interSemiBold mb-1'>
                Cash Payment
              </Text>
              <Text className='text-muted font-inter text-sm'>
                Please prepare the exact amount of payment in cash and bring it to the property.
              </Text>

              <View className='mt-4 flex gap-3'>
                <Text className='text-muted text-sm font-inter'>
                  After you have made the cash payment, kindly fill out the Cash Payment Confirmation Form to confirm your payment.
                </Text>

                <DateTimeField
                  label='Payment Date:'
                  placeholder='Select date of payment'
                />

                <TextField isRequired>
                  <Label>Amount Paid:</Label>
                  <Input
                    placeholder='₱ 0.00'
                    value={amountPaid}
                    keyboardType='decimal-pad'
                    variant='primary'
                    onChangeText={(value) => setAmountPaid(sanitizeDecimalInput(value))}
                  />
                </TextField>
              </View>
            </View>
          )}
        </Card.Body>
      </Card>
    </ScreenWrapper>
  )
}
