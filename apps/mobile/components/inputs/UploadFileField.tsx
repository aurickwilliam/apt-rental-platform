import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import * as DocumentPicker from 'expo-document-picker'

import { FileText, XCircle, UploadCloud, RefreshCw } from 'lucide-react-native'

import { useColors } from '@/hooks/useTheme'

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
  const showPicker = !hasFile

  return (
    <View className="gap-2">
      {/* Label */}
      <Text className="text-base font-semibold text-foreground">
        {label}
        {required && <Text className="text-danger"> *</Text>}
      </Text>

      {/* File preview card */}
      {hasFile && (
        <View className="flex-row items-center gap-3 rounded-2xl bg-surface border border-border px-4 py-3.5 mt-1">
          <FileText size={28} color={colors.primary} strokeWidth={1.5} />

          <Text
            className="flex-1 text-sm font-medium text-foreground"
            numberOfLines={1}
          >
            {displayName}
          </Text>

          <TouchableOpacity
            onPress={removeFile}
            disabled={disabled}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <XCircle
              size={20}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Upload button — hidden once a file is set */}
      {showPicker && (
        <TouchableOpacity
          onPress={pickFile}
          disabled={disabled || loading}
          className={[
            "flex-row items-center justify-center gap-2 border-2 border-dashed rounded-2xl py-4.5",
            error
              ? "border-danger bg-surface"
              : "border-border bg-surface",
            (disabled || loading) ? "opacity-50" : "opacity-100",
          ].join(" ")}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <>
              <UploadCloud
                size={22}
                color={colors.primary}
              />
              <Text className="text-sm font-medium text-foreground">
                {placeholder ?? "Upload a file"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Error message */}
      {!!error && <Text className="text-xs text-danger">{error}</Text>}

      {/* Replace button shown when a file is already set */}
      {hasFile && (
        <TouchableOpacity
          onPress={pickFile}
          disabled={disabled}
          className="flex-row items-center gap-1 self-start"
        >
          <RefreshCw size={16} color={colors.primary} />
          <Text
            className="text-[13px] font-medium"
            style={{ color: colors.primary }}
          >
            Replace file
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}