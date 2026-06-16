import { useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'

import { IconFileUpload, IconFile, IconX } from '@tabler/icons-react-native'

import { useColors } from '@/hooks/useTheme'

import { Button } from "heroui-native"

interface UploadFileFieldProps {
  label: string
  placeholder?: string
  onChange?: (asset: DocumentPicker.DocumentPickerAsset | null) => void
  value?: DocumentPicker.DocumentPickerAsset | null
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
  const { colors } = useColors();

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

      onChange?.(result.assets[0])
    } finally {
      setLoading(false)
    }
  }

  const removeFile = () => {
    onChange?.(null)
  }

  const hasFile = !!value
  const displayName = value?.name ?? ''

  return (
    <View className="w-full flex-col gap-2">
      {/* Label */}
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-interMedium text-foreground flex-1">
          {label}
        </Text>
        {required && (
          <Text className="text-base font-inter text-danger">
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
            ? 'bg-surface border-border'
            : 'bg-surface border-gray-400 border-dashed',
          error
            ? 'border-danger bg-danger-light'
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
              color={colors.primary}
              strokeWidth={1}
            />
            <Text
              className="text-center text-foreground font-interMedium text-sm"
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
              color={colors.textSecondary}
              strokeWidth={1}
            />
            <Text className="text-center text-gray-400 font-interMedium">
              {placeholder ?? 'No documents uploaded yet.'}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Error Message */}
      {!!error && (
        <Text className="text-base text-danger font-inter mt-1">
          {error}
        </Text>
      )}

      {/* Buttons */}
      <View className="flex-1 flex-row gap-4 mt-3">
        <Button
          size="sm"
          onPress={pickFile}
          isDisabled={disabled || loading}
          className="flex-1"
          variant="secondary"
        >
          <IconFileUpload size={16} color={colors.primary} />
          <Button.Label>
            {hasFile ? 'Replace File' : 'Upload a File'}
          </Button.Label>
        </Button>

        <Button
          size="sm"
          onPress={removeFile}
          isDisabled={disabled || !hasFile}
          className="flex-1"
          variant="danger-soft"
        >
          <IconX size={16} color={colors.danger} />
          <Button.Label>
            Remove File
          </Button.Label>
        </Button>
      </View>
    </View>
  )
}