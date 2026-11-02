import { Text, View } from 'react-native'
import { Label, Radio, RadioGroup } from 'heroui-native'
import { getBankAvailability, getBankTransferBank, type BankCode } from '@repo/constants'

interface BankTransferPickerProps {
  amount: number
  selectedBank: BankCode | null
  onBankChange: (bank: BankCode) => void
  error?: string
}

// Banks over their per-payment limit stay visible but disabled, with the reason.
export default function BankTransferPicker({ amount, selectedBank, onBankChange, error }: BankTransferPickerProps) {
  return (
    <View className='mt-4 gap-2'>
      <Text className='text-foreground text-base font-nunitoSemiBold'>Choose your bank</Text>
      <Text className='text-muted text-sm font-inter'>
        This is a test payment: you will land on a test bank page and no real money moves.
      </Text>
      <RadioGroup
        value={selectedBank ?? undefined}
        onValueChange={(value) => { if (getBankTransferBank(value)) onBankChange(value as BankCode) }}
      >
        {getBankAvailability(amount).map(({ bank, available, reason }) => (
          <RadioGroup.Item
            key={bank.code}
            value={bank.code}
            isDisabled={!available}
            accessibilityLabel={available ? bank.name : `${bank.name}, unavailable. ${reason}`}
            className='flex-row items-center justify-between gap-3 min-h-12 py-2'
          >
            <View className='flex-1'>
              <Label>{bank.name}</Label>
              {reason && <Text className='text-muted text-xs font-inter mt-0.5'>{reason}</Text>}
            </View>
            <Radio><Radio.Indicator className='border border-border shadow-none rounded-full' /></Radio>
          </RadioGroup.Item>
        ))}
      </RadioGroup>
      {error && <Text accessibilityRole='alert' className='text-danger text-sm font-inter'>{error}</Text>}
    </View>
  )
}
