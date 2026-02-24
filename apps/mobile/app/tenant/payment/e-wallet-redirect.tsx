import { View, Text } from 'react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'

export default function EWalletRedirect() {
  return (
    <ScreenWrapper
      header={
        <StandardHeader title='Redirecting to E-Wallet' />
      }
      className='p-5'
    >
      <Text>EWalletRedirect</Text>
    </ScreenWrapper>
  )
}