import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'

import { UploadCloud, XCircle, RefreshCw } from 'lucide-react-native'

import { useColors } from '@/hooks/useTheme'

interface UploadImageFieldProps {
  label: string
  required?: boolean
  single?: boolean
  images: ImagePicker.ImagePickerAsset[]
  onAdd: (images: ImagePicker.ImagePickerAsset | ImagePicker.ImagePickerAsset[]) => void
  onRemove: (uri: string) => void
  error?: string
}

const THUMB_SIZE = 100

export default function UploadImageField({
  label,
  required,
  single = false,
  images = [],
  onAdd,
  onRemove,
  error,
}: UploadImageFieldProps) {
  const { colors } = useColors();

  const [loading, setLoading] = useState(false)

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return

    setLoading(true)
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsMultipleSelection: !single,
      quality: 0.75,
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
      <Text className="text-base font-semibold text-foreground">
        {label}
        {required && <Text className="text-danger"> *</Text>}
      </Text>

      {/* Preview strip */}
      {images.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mt-1">
          {images.map((item) => (
            <View
              key={item.uri}
              className="relative"
              style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
            >
              <Image
                source={{ uri: item.uri }}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.gray200,
                }}
                contentFit="cover"
                cachePolicy="disk"
              />

              <TouchableOpacity
                className="absolute -top-1.5 -right-1.5 rounded-full bg-surface"
                onPress={() => onRemove(item.uri)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <XCircle size={18} color={colors.textPrimary} />
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
            "flex-row items-center justify-center gap-2 border-2 border-dashed rounded-xl py-4.5",
            error
              ? "border-danger bg-surface"
              : "border-border bg-surface",
            loading ? "opacity-50" : "opacity-100",
          ].join(" ")}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <UploadCloud size={22} color={colors.primary} />
              <Text className="text-sm font-medium text-foreground">
                {single ? "Choose photo" : "Add photos"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Error message */}
      {!!error && <Text className="text-xs text-danger">{error}</Text>}

      {/* Replace button shown in single mode when image is already set */}
      {single && images.length > 0 && (
        <TouchableOpacity
          onPress={pickImage}
          className="flex-row items-center gap-1 self-start"
        >
          <RefreshCw size={16} color={colors.primary} />
          <Text
            className="text-[13px] font-medium"
            style={{ color: colors.primary }}
          >
            Replace photo
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
