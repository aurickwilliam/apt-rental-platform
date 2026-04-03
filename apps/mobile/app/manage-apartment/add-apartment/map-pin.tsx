import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { MapView, Camera, PointAnnotation, setAccessToken } from '@maplibre/maplibre-react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import PillButton from '@/components/buttons/PillButton'
import { COLORS } from '@repo/constants'
import { useApartmentFormStore } from '@/store/useApartmentFormStore'

setAccessToken(null)

const DEFAULT_COORDS = {
  latitude: 14.6700,
  longitude: 120.9600,
}

const MAP_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
}

export default function MapPin() {
  const router = useRouter()
  const { latitude, longitude, setField } = useApartmentFormStore()

  const initialCoords = {
    latitude: latitude ?? DEFAULT_COORDS.latitude,
    longitude: longitude ?? DEFAULT_COORDS.longitude,
  }

  // ✅ Camera center is fixed on mount — does NOT follow marker drags
  const [cameraCenter] = useState<[number, number]>([
    initialCoords.longitude,
    initialCoords.latitude,
  ])

  const [markerCoords, setMarkerCoords] = useState(initialCoords)

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
          mapStyle={MAP_STYLE}
          onPress={handleMapPress}
        >
          <Camera
            defaultSettings={{
              centerCoordinate: cameraCenter,
              zoomLevel: 15,
            }}
            maxZoomLevel={19}
            animationDuration={0}
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
            <View
              style={{
                width: 20,
                height: 20,
                backgroundColor: COLORS.primary,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: '#ffffff',
              }}
            />
          </PointAnnotation>
        </MapView>

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