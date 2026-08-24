import { View, Text } from 'react-native'
import { Card, Chip } from 'heroui-native'
import { IconCash } from '@tabler/icons-react-native'

import { formatPesoDisplay } from '@repo/utils'
import { useColors } from 'hooks/useTheme'
import { payoutStatusLabel } from '@/service/payments/payoutService'

interface Props {
  referenceNumber: string | null
  periodStart: string | null
  periodEnd: string | null
  amount: number | null
  netAmount: number | null
  fee: number | null
  status: string
  destinationLabel?: string
}

export default function PayoutHistoryCard({
  referenceNumber,
  periodStart,
  periodEnd,
  amount,
  netAmount,
  fee,
  status,
  destinationLabel,
}: Props) {
  const { colors } = useColors()
  const label = payoutStatusLabel(status)
  const bg =
    status === 'completed'
      ? colors.successLight
      : status === 'processing' || status === 'pending'
        ? colors.warningLight ?? '#FFF7ED'
        : colors.dangerLight ?? '#FEE2E2'
  const fg =
    status === 'completed'
      ? colors.success
      : status === 'processing' || status === 'pending'
        ? colors.warning ?? '#92400E'
        : colors.danger ?? '#DC2626'

  return (
    <Card className="border border-border shadow-none rounded-3xl">
      <Card.Header>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <IconCash size={18} color={colors.gray500} />
            <Text className="text-foreground font-nunitoSemiBold text-base" numberOfLines={1}>
              {referenceNumber ?? '—'}
            </Text>
          </View>
          <Chip variant="soft" size="md" animation="disable-all" style={{ backgroundColor: bg }}>
            <Chip.Label style={{ color: fg }} className="text-xs font-nunitoSemiBold">
              {label}
            </Chip.Label>
          </Chip>
        </View>
      </Card.Header>
      <Card.Body className="pt-2 gap-1">
        <Text className="text-foreground text-xl font-nunitoBold">{formatPesoDisplay(netAmount ?? 0)}</Text>
        <Text className="text-gray-500 text-xs font-inter">
          Gross {formatPesoDisplay(amount ?? 0)} • Fee {formatPesoDisplay(fee ?? 0)} {destinationLabel ? `• ${destinationLabel}` : ''}
        </Text>
        {periodStart ? (
          <Text className="text-gray-500 text-xs font-inter">
            Period {periodStart} {periodEnd ? `– ${periodEnd}` : ''}
          </Text>
        ) : null}
      </Card.Body>
    </Card>
  )
}
