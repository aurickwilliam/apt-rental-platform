import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { MapView, Camera, PointAnnotation, setAccessToken } from '@maplibre/maplibre-react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import PillButton from '@/components/buttons/PillButton'
import { COLORS } from '@repo/constants'
import { useApartmentFormStore } from '@/store/useApartmentFormStore'

// Suppress the missing API key warning since we're using free OSM tiles
setAccessToken(null)

const DEFAULT_COORDS = {
  latitude: 14.5995,   // Manila
  longitude: 120.9842,
}

export default function MapPin() {
  const router = useRouter()
  const { latitude, longitude, setField } = useApartmentFormStore()

  const [markerCoords, setMarkerCoords] = useState({
    latitude: latitude ?? DEFAULT_COORDS.latitude,
    longitude: longitude ?? DEFAULT_COORDS.longitude,
  })

  const handleMapPress = (e: GeoJSON.Feature<GeoJSON.Geometry>) => {
    if (e.geometry.type !== 'Point') return
    const [lng, lat] = e.geometry.coordinates as [number, number]
    setMarkerCoords({ latitude: lat, longitude: lng })
  }

  const handleConfirm = () => {
    setField('latitude', markerCoords.latitude)
    setField('longitude', markerCoords.longitude)
    setField('mapConfirmed', true)
    router.back()
  }

  return (
    <ScreenWrapper backgroundColor={COLORS.darkerWhite}>
      <View className='flex-1'>
        <MapView
          style={{ flex: 1 }}
          mapStyle='https://demotiles.maplibre.org/style.json'
          onPress={handleMapPress}
        >
          <Camera
            centerCoordinate={[markerCoords.longitude, markerCoords.latitude]}
            zoomLevel={14}
          />
          <PointAnnotation
            id='pin'
            coordinate={[markerCoords.longitude, markerCoords.latitude]}
            draggable
            onDragEnd={(e) => {
              const [lng, lat] = e.geometry.coordinates
              setMarkerCoords({ latitude: lat, longitude: lng })
            }}
          >
            <View className='w-4 h-4 bg-primary rounded-full border-2 border-white' />
          </PointAnnotation>
        </MapView>

        {/* Coordinates preview + confirm */}
        <View className='p-5 gap-4'>
          <View className='flex-row justify-between'>
            <Text className='text-text font-interMedium'>Latitude:</Text>
            <Text className='text-text font-inter'>
              {markerCoords.latitude.toFixed(6)}
            </Text>
          </View>
          <View className='flex-row justify-between'>
            <Text className='text-text font-interMedium'>Longitude:</Text>
            <Text className='text-text font-inter'>
              {markerCoords.longitude.toFixed(6)}
            </Text>
          </View>

          <PillButton
            label='Confirm Location'
            isFullWidth
            onPress={handleConfirm}
          />
        </View>
      </View>
    </ScreenWrapper>
  )
}