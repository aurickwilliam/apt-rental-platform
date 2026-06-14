import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { MapView, Camera, PointAnnotation, setAccessToken } from '@maplibre/maplibre-react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'

import { Button } from 'heroui-native'

import { useColors } from '@/hooks/useTheme'

import { useApartmentFormStore } from '@/stores/useApartmentFormStore'

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
  const { colors } = useColors();

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
    <ScreenWrapper>
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
                backgroundColor: colors.primary,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: '#ffffff',
              }}
            />
          </PointAnnotation>
        </MapView>

        <View className='p-5 gap-4'>
          <View className='flex-row justify-between'>
            <Text className='text-foreground font-interMedium'>
              Latitude:
            </Text>

            <Text className='text-muted font-inter'>
              {markerCoords.latitude.toFixed(6)}
            </Text>
          </View>
          <View className='flex-row justify-between'>
            <Text className='text-foreground font-interMedium'>
              Longitude:
            </Text>

            <Text className='text-muted font-inter'>
              {markerCoords.longitude.toFixed(6)}
            </Text>
          </View>

          <Button onPress={handleConfirm}>
            <Button.Label>
              Confirm Location
            </Button.Label>
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  )
}