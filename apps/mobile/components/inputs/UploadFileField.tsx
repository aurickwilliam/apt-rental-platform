import { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'

import PillButton from 'components/buttons/PillButton'
import { COLORS } from '@repo/constants'
import { IconFileUpload, IconFile, IconX } from '@tabler/icons-react-native'

interface UploadFileFieldProps {
  label: string
  placeholder?: string
  onChange?: (uri: string) => void
  value?: string
  disabled?: boolean
  error?: string
  required?: boolean
  acceptedTypes?: string[]
}

export default function UploadFileField({
  label,
  placeholder,
  onChange,
  value,
  disabled,
  error,
  required,
  acceptedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
}: UploadFileFieldProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const pickFile = async () => {
    if (disabled) return

    setLoading(true)
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: acceptedTypes,
        copyToCacheDirectory: true,
        multiple: false,
      })

      if (result.canceled) return

      const asset = result.assets[0]
      setFileName(asset.name)
      onChange?.(asset.uri)
    } finally {
      setLoading(false)
    }
  }

  const removeFile = () => {
    setFileName(null)
    onChange?.('')
  }

  const hasFile = !!fileName || !!value
  const displayName = fileName ?? value?.split('/').pop() ?? ''

  return (
    <View className="w-full flex-col gap-2">
      {/* Label */}
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-interMedium text-text flex-1">
          {label}
        </Text>
        {required && (
          <Text className="text-base font-inter text-redHead-200">
            *Required
          </Text>
        )}
      </View>

      {/* File Area */}
      <TouchableOpacity
        onPress={pickFile}
        disabled={disabled || loading}
        activeOpacity={0.8}
        className={[
          'w-full h-52 rounded-xl border items-center justify-center',
          hasFile
            ? 'bg-white border-gray-300'
            : 'bg-white border-gray-300',
          error
            ? 'border-redHead-200 bg-red-50'
            : '',
          disabled
            ? 'opacity-50'
            : '',
        ].join(' ')}
      >
        {hasFile ? (
          // File preview
          <View className="flex-col gap-3 items-center justify-center px-6">
            <IconFile
              size={56}
              color={COLORS.primary}
              strokeWidth={1}
            />
            <Text
              className="text-center text-text font-interMedium text-sm"
              numberOfLines={2}
            >
              {displayName}
            </Text>
            <Text className="text-xs text-gray-400 font-inter">
              Tap to replace
            </Text>
          </View>
        ) : (
          // Empty state
          <View className="flex gap-3 items-center justify-center px-6">
            <IconFileUpload
              size={64}
              color={COLORS.mediumGrey}
              strokeWidth={1}
            />
            <Text className="text-center text-grey-400 font-interMedium">
              {placeholder ?? 'No documents uploaded yet.'}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Error Message */}
      {!!error && (
        <Text className="text-base text-redHead-200 font-inter mt-1">
          {error}
        </Text>
      )}

      {/* Buttons */}
      <View className="flex-1 flex-row gap-4 mt-3">
        <View className="flex-1">
          <PillButton
            label={hasFile ? 'Replace File' : 'Upload a File'}
            size="sm"
            type="secondary"
            isFullWidth
            leftIconName={IconFileUpload}
            onPress={pickFile}
            isDisabled={disabled || loading}
          />
        </View>
        {hasFile && (
          <View className="flex-1">
            <PillButton
              label="Remove File"
              size="sm"
              type="secondary"
              isFullWidth
              leftIconName={IconX}
              onPress={removeFile}
              isDisabled={disabled}
            />
          </View>
        )}
      </View>
    </View>
  )
}