import { useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { WebView } from 'react-native-webview'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'

import { COLORS } from '@repo/constants'

export default function LeaseViewer() {
  const router = useRouter()
  const { fileUrl } = useLocalSearchParams<{
    fileUrl: string
  }>()

  const [loading, setLoading] = useState(true)

  // Google Docs Viewer handles both PDF and DOCX
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`

  return (
    <ScreenWrapper
      header={
        <StandardHeader
          title="Lease Agreement"
          onBackPress={() => router.back()}
        />
      }
    >
      {loading && (
        <View className="absolute inset-0 items-center justify-center z-10">
          <ActivityIndicator color={COLORS.primary} />
        </View>
      )}
      
      <WebView
        source={{ uri: viewerUrl }}
        onLoadEnd={() => setLoading(false)}
        className="flex-1"
      />
    </ScreenWrapper>
  )
}