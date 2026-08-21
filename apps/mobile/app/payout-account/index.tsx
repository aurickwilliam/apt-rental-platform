import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'

import { Button, Chip, ListGroup, Separator } from 'heroui-native'
import { IconChevronRight, IconLock, IconPlus, IconWallet } from '@tabler/icons-react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import EmptyState from '@/components/display/EmptyState'

import { useColors } from '@/hooks/useTheme'
import { useProfile } from '@/hooks/auth'
import {
  usePayoutDestinations,
} from '@/hooks/payments'
import { PAYOUT_DESTINATION_LABELS, type PayoutDestinationType } from '@repo/constants'

export default function PayoutAccount() {
  const router = useRouter()
  const { colors } = useColors()
  const { profile } = useProfile()

  const destinationsQuery = usePayoutDestinations()
  const destinations = destinationsQuery.data ?? []

  // RLS rejects destination writes unless users.account_status = 'verified',
  // so gate the whole screen on the same condition.
  const isVerified = profile?.account_status === 'verified'

  const renderDestination = () => (
    <ListGroup className='shadow-none border border-border'>
      {destinations.map((destination, index) => (
        <View key={destination.id}>
          <ListGroup.Item
            onPress={() => router.push(`/payout-account/${destination.id}`)}
          >
            <ListGroup.ItemPrefix>
              <IconWallet size={22} color={colors.textPrimary} />
            </ListGroup.ItemPrefix>

            <ListGroup.ItemContent>
              <ListGroup.ItemTitle className='font-nunitoSemiBold'>
                {destination.account_name}
              </ListGroup.ItemTitle>
              <View className='flex-row items-center gap-2 mt-0.5'>
                <ListGroup.ItemDescription>
                  {PAYOUT_DESTINATION_LABELS[destination.type as PayoutDestinationType] ?? destination.type}
                  {' • '}
                  {destination.account_number}
                </ListGroup.ItemDescription>

                {destination.is_default && (
                  <Chip variant='soft' size='sm' animation='disable-all'>
                    <Chip.Label className='text-xs font-nunitoSemiBold text-primary'>
                      Default
                    </Chip.Label>
                  </Chip>
                )}
              </View>
            </ListGroup.ItemContent>

            <ListGroup.ItemSuffix>
              <IconChevronRight size={20} color={colors.textPrimary} />
            </ListGroup.ItemSuffix>
          </ListGroup.Item>

          {index < destinations.length - 1 && (
            <Separator className='mx-4' />
          )}
        </View>
      ))}
    </ListGroup>
  )

  const renderUnverifiedGate = () => (
    <View className='gap-4'>
      <View className='items-center gap-3 border border-border rounded-2xl p-6'>
        <IconLock size={40} color={colors.primary} />
        <Text className='text-foreground text-base font-nunitoBold text-center'>
          Verification required
        </Text>
        <Text className='text-gray-500 text-sm font-inter text-center'>
          Verify your identity to add a payout account where your rent collections are sent.
        </Text>
      </View>
      <Button onPress={() => router.push('/document-id')}>
        <Button.Label>Verify My Identity</Button.Label>
      </Button>
    </View>
  )

  return (
    <ScreenWrapper
      className='p-5'
      header={<StandardHeader title='Payout Account' />}
    >
      {!isVerified ? (
        renderUnverifiedGate()
      ) : destinations.length === 0 ? (
        <EmptyState
          icon={<IconWallet size={48} color={colors.primary} />}
          title='No payout account yet'
          description='Add the GCash or Maya number where your rent payouts will be sent.'
        />
      ) : destinationsQuery.isLoading ? null : (
        renderDestination()
      )}

      {isVerified && (
        <Button
          variant='secondary'
          className='mt-5'
          onPress={() => router.push('/payout-account/new')}
        >
          <IconPlus size={18} color={colors.primary} />
          <Button.Label>Add Payout Account</Button.Label>
        </Button>
      )}
    </ScreenWrapper>
  )
}
