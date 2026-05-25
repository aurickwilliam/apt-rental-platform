import { useState, useEffect } from 'react'
import { View, ActivityIndicator, Text } from 'react-native'
import { WebView } from 'react-native-webview'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'

import { supabase } from '@repo/supabase'
import { COLORS } from '@repo/constants'
import { useTenancy } from 'hooks/useTenancy'

import { IconAlertCircle } from '@tabler/icons-react-native'

export default function CurrentLease() {
  const { tenancy, loading: tenancyLoading } = useTenancy()
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [urlLoading, setUrlLoading] = useState(false)
  const [webViewLoading, setWebViewLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenancy?.apartment.lease_agreement_url) return
    generateSignedUrl(tenancy.apartment.lease_agreement_url)
  }, [tenancy?.apartment.lease_agreement_url])

  async function generateSignedUrl(storagePath: string) {
    try {
      setUrlLoading(true)
      setError(null)

      const { data, error: signedUrlError } = await supabase.storage
        .from('lease-agreements')
        .createSignedUrl(storagePath, 3600)

      if (signedUrlError || !data?.signedUrl) {
        throw signedUrlError ?? new Error('Failed to generate URL')
      }

      setSignedUrl(data.signedUrl)
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setUrlLoading(false)
    }
  }

  const isLoading = tenancyLoading || urlLoading

  if (isLoading) {
    return (
      <ScreenWrapper header={<StandardHeader title="Current Lease" />}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="text-text text-sm font-inter mt-3">
            Loading lease agreement...
          </Text>
        </View>
      </ScreenWrapper>
    )
  }

  if (error || !signedUrl) {
    return (
      <ScreenWrapper header={<StandardHeader title="Current Lease" />}>
        <View className="flex-1 items-center justify-center px-6">
          <IconAlertCircle size={40} color={COLORS.mediumGrey} />
          <Text className="text-text text-base font-interSemiBold mt-3 text-center">
            No Lease Agreement
          </Text>
          <Text className="text-mediumGrey text-sm font-inter mt-1 text-center">
            {error ?? 'Your landlord has not uploaded a lease agreement yet.'}
          </Text>
        </View>
      </ScreenWrapper>
    )
  }

  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(signedUrl)}&embedded=true`

  return (
    <ScreenWrapper header={<StandardHeader title="Current Lease" />}>
      {webViewLoading && (
        <View className="absolute inset-0 items-center justify-center z-10">
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}
      <WebView
        source={{ uri: viewerUrl }}
        onLoadEnd={() => setWebViewLoading(false)}
        className="flex-1"
      />
    </ScreenWrapper>
  )
}