import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'

import { BottomSheet, Separator } from 'heroui-native'

import {
  IconCircleX,
  IconFileText,
  IconFileUpload,
  IconPhotoPlus,
  IconRefresh
} from '@tabler/icons-react-native'

import { useColors } from '@/hooks/useTheme'
import { compressImage } from '@/utils/compressImage'

export type UploadedDocument =
  | { kind: 'image'; asset: ImagePicker.ImagePickerAsset }
  | { kind: 'file'; asset: DocumentPicker.DocumentPickerAsset }

interface UploadDocumentFieldProps {
  label: string
  required?: boolean
  value: UploadedDocument | null
  onChange: (document: UploadedDocument | null) => void
  error?: string
  maxFileSizeMB?: number
  /**
   * MIME types accepted by the file-picker path (`pickFile()`/`DocumentPicker`)
   * only. Has no effect on `pickImage()` (the JPG/PNG image-library path),
   * which has no accepted-types list of its own. Defaults to the existing
   * `ACCEPTED_FILE_TYPES` (PDF + Word doc types) so existing callers are
   * unaffected.
   */
  acceptedFileMimeTypes?: string[]
}

const THUMB_SIZE = 100

const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export default function UploadDocumentField({
  label,
  required,
  value,
  onChange,
  error,
  maxFileSizeMB = 5,
  acceptedFileMimeTypes = ACCEPTED_FILE_TYPES,
}: UploadDocumentFieldProps) {
  const { colors } = useColors();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [typeError, setTypeError] = useState<string | null>(null);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) return

    setLoading(true)
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsMultipleSelection: false,
        quality: 0.75,
        selectionLimit: 1,
      })
      if (result.canceled) return

      const picked = result.assets[0]
      const compressed = await compressImage(picked.uri, picked.width, picked.height)

      setSizeError(null)
      setTypeError(null)
      onChange({
        kind: 'image',
        asset: {
          ...picked,
          uri: compressed.uri,
          width: compressed.width,
          height: compressed.height,
        },
      })
    } finally {
      setLoading(false)
    }
  }

  const pickFile = async () => {
    setLoading(true)
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: acceptedFileMimeTypes,
        copyToCacheDirectory: true,
        multiple: false,
      })
      if (result.canceled) return

      const asset = result.assets[0]

      if (asset.mimeType != null && !acceptedFileMimeTypes.includes(asset.mimeType)) {
        setTypeError('This file type is unsupported.')
        return
      }

      if (asset.size != null && asset.size > maxFileSizeMB * 1024 * 1024) {
        setSizeError(`File must be ${maxFileSizeMB}MB or smaller.`)
        return
      }

      setSizeError(null)
      setTypeError(null)
      onChange({ kind: 'file', asset })
    } finally {
      setLoading(false)
    }
  }

  const remove = () => {
    onChange(null)
  }

  const displayError = error ?? typeError ?? sizeError

  return (
    <View className="gap-2">
      {/* Label */}
      <Text className="text-base font-semibold text-foreground">
        {label}
        {required && <Text className="text-danger"> *</Text>}
      </Text>

      {/* Preview */}
      {value?.kind === 'image' && (
        <View
          className="relative mt-1"
          style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
        >
          <Image
            source={{ uri: value.asset.uri }}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.gray200,
            }}
            contentFit="cover"
            cachePolicy="disk"
          />

          <TouchableOpacity
            className="absolute -top-1.5 -right-1.5 rounded-full bg-surface"
            onPress={remove}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <IconCircleX size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      )}

      {value?.kind === 'file' && (
        <View className="flex-row items-center gap-3 rounded-2xl bg-surface border border-border px-4 py-3.5 mt-1">
          <IconFileText size={28} color={colors.primary} strokeWidth={1.5} />

          <Text
            className="flex-1 text-sm font-medium text-foreground"
            numberOfLines={1}
          >
            {value.asset.name}
          </Text>

          <TouchableOpacity
            onPress={remove}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <IconCircleX size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Upload / replace area */}
      {loading ? (
        <View className="flex-row items-center justify-center gap-2 border-2 border-dashed rounded-2xl py-4.5 bg-surface opacity-50">
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : value ? (
        <TouchableOpacity
          onPress={() => setIsOpen(true)}
          className="flex-row items-center gap-1 self-start"
        >
          <IconRefresh size={16} color={colors.primary} />
          <Text
            className="text-[13px] font-medium"
            style={{ color: colors.primary }}
          >
            Replace document
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => setIsOpen(true)}
          className={[
            'flex-row items-center justify-center gap-2 border-2 border-dashed rounded-2xl py-4.5',
            displayError
              ? 'border-danger bg-surface'
              : 'border-border bg-surface',
          ].join(' ')}
        >
          <IconFileUpload size={22} color={colors.primary} />
          <Text className="text-sm font-medium text-foreground">
            Add document
          </Text>
        </TouchableOpacity>
      )}

      {/* Error message */}
      {!!displayError && <Text className="text-xs text-danger">{displayError}</Text>}

      {/* Source picker */}
      <BottomSheet isOpen={isOpen} onOpenChange={setIsOpen}>
        <BottomSheet.Portal>
          <BottomSheet.Overlay />
          <BottomSheet.Content>
            <View className="flex gap-1 pb-4">
              <Text className="text-lg font-interMedium text-foreground pb-2">
                Add document
              </Text>

              <TouchableOpacity
                className="flex-row items-center gap-3 p-3 rounded-xl"
                onPress={() => {
                  setIsOpen(false)
                  pickImage()
                }}
              >
                <IconPhotoPlus size={22} color={colors.primary} />
                <Text className="text-base text-foreground font-inter">
                  Choose photo
                </Text>
              </TouchableOpacity>

              <Separator className="bg-gray-300 my-1" />

              <TouchableOpacity
                className="flex-row items-center gap-3 p-3 rounded-xl"
                onPress={() => {
                  setIsOpen(false)
                  pickFile()
                }}
              >
                <IconFileText size={22} color={colors.primary} />
                <Text className="text-base text-foreground font-inter">
                  Choose file
                </Text>
              </TouchableOpacity>
            </View>
          </BottomSheet.Content>
        </BottomSheet.Portal>
      </BottomSheet>
    </View>
  )
}
