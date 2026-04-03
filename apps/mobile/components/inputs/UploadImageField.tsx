import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@repo/constants'

interface UploadImageFieldProps {
  label: string
  required?: boolean
  single?: boolean
  images: ImagePicker.ImagePickerAsset[]
  onAdd: (images: ImagePicker.ImagePickerAsset | ImagePicker.ImagePickerAsset[]) => void
  onRemove: (uri: string) => void
  error?: string
}

export default function UploadImageField({
  label,
  required,
  single = false,
  images = [],
  onAdd,
  onRemove,
  error,
}: UploadImageFieldProps) {
  const [loading, setLoading] = useState(false)

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return

    setLoading(true)
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: !single,
      quality: 0.8,
    })
    setLoading(false)

    if (result.canceled) return

    if (single) {
      // Single mode: pass one asset
      onAdd(result.assets[0])
    } else {
      // Multiple mode: pass the full batch so the parent can count correctly
      onAdd(result.assets)
    }
  }

  const showPicker = single ? images.length === 0 : true

  return (
    <View className="gap-2">
      {/* Label */}
      <Text className="text-base font-semibold text-gray-700">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
      </Text>

      {/* Preview strip */}
      {images.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mt-1">
          {images.map((item) => (
            <View key={item.uri} className="relative flex-1 aspect-square" style={{ minWidth: '30%' }}>
              <Image
                source={{ uri: item.uri }}
                className="w-full h-full rounded-xl"
                resizeMode="cover"
              />
              <TouchableOpacity
                className="absolute -top-1.5 -right-1.5 rounded-full bg-black/45"
                onPress={() => onRemove(item.uri)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="close-circle" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Upload button — hidden in single mode once an image is set */}
      {showPicker && (
        <TouchableOpacity
          onPress={pickImage}
          disabled={loading}
          className={[
            'flex-row items-center justify-center gap-2 border-2 border-dashed rounded-xl py-[18px]',
            error
              ? 'border-red-500 bg-red-50'
              : 'border-slate-300 bg-slate-50',
            loading ? 'opacity-50' : 'opacity-100',
          ].join(' ')}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={22} color={COLORS.primary} />
              <Text className="text-sm font-medium text-slate-500">
                {single ? 'Choose photo' : 'Add photos'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Error message */}
      {!!error && (
        <Text className="text-xs text-red-500">{error}</Text>
      )}

      {/* Replace button shown in single mode when image is already set */}
      {single && images.length > 0 && (
        <TouchableOpacity onPress={pickImage} className="flex-row items-center gap-1 self-start">
          <Ionicons name="refresh-outline" size={16} color={COLORS.primary} />
          <Text className="text-[13px] font-medium" style={{ color: COLORS.primary }}>
            Replace photo
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}