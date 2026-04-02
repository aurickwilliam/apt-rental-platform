import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  FlatList,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@repo/constants'

interface UploadImageFieldProps {
  label: string
  required?: boolean  
  single?: boolean
  images: ImagePicker.ImagePickerAsset[]
  onAdd: (image: ImagePicker.ImagePickerAsset) => void
  onRemove: (uri: string) => void
  error?: string
}

export default function UploadImageField({
  label,
  required,
  single = false,
  images,
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: !single,
      quality: 0.8,
    })
    setLoading(false)

    if (result.canceled) return

    // In single mode, replace; in multiple mode, append each selected asset
    if (single) {
      onAdd(result.assets[0])
    } else {
      result.assets.forEach((asset) => onAdd(asset))
    }
  }

  const showPicker = single ? images.length === 0 : true

  return (
    <View className='gap-2'>
      {/* Label */}
      <Text className='text-base font-semibold text-gray-700'>
        {label}
        {required && <Text className='text-red-500'> *</Text>}
      </Text>

      {/* Preview strip */}
      {images.length > 0 && (
        <FlatList
          data={images}
          horizontal
          keyExtractor={(item) => item.uri}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 3 }}
          renderItem={({ item }) => (
            <View style={styles.previewWrapper}>
              <Image
                source={{ uri: item.uri }}
                style={styles.previewImage}
                resizeMode="cover"
              />

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => onRemove(item.uri)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="close-circle" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Upload button — hidden in single mode once an image is set */}
      {showPicker && (
        <TouchableOpacity
          onPress={pickImage}
          disabled={loading}
          style={[
            styles.uploadButton, 
            loading && styles.uploadButtonDisabled,
            !!error && styles.uploadButtonError,
          ]}
        >
          {loading ? (
            <ActivityIndicator size='small' color={COLORS.primary} />
          ) : (
            <>
              <Ionicons name='cloud-upload-outline' size={22} color={COLORS.primary} />
              <Text style={styles.uploadText}>
                {single ? 'Choose photo' : 'Add photos'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Error message */}
      {!!error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {/* Replace button shown in single mode when image is already set */}
      {single && images.length > 0 && (
        <TouchableOpacity onPress={pickImage} style={styles.replaceButton}>
          <Ionicons name='refresh-outline' size={16} color={COLORS.primary} />
          <Text style={styles.replaceText}>Replace photo</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  previewWrapper: {
    position: 'relative',
    marginRight: 10,
    marginTop: 8,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 99,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 18,
    backgroundColor: '#F8FAFC',
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  replaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  replaceText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  uploadButtonError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '400',
  },
})