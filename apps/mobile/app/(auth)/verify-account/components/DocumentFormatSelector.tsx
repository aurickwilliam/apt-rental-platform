import { TouchableOpacity, View } from 'react-native'

import { Card } from 'heroui-native'

import { IconFileText, IconId } from '@tabler/icons-react-native'

import { useColors } from '@/hooks/useTheme'
import type { DocumentFormat } from '@/stores/useVerificationStore'

interface DocumentFormatSelectorProps {
  value: DocumentFormat | null
  onSelect: (format: DocumentFormat) => void
}

interface FormatOption {
  format: DocumentFormat
  title: string
  description: string
  icon: typeof IconId
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    format: 'physical',
    title: 'Physical ID',
    description: 'Capture a fresh photo of your physical ID card using your camera.',
    icon: IconId,
  },
  {
    format: 'digital',
    title: 'Digital Document',
    description: 'Upload an existing digital photo, scan, or PDF of your ID.',
    icon: IconFileText,
  },
]

/**
 * Lets the tenant declare whether their ID will be provided as a physical
 * card (captured live via the camera) or a digital document (uploaded via
 * the picker path). Both options remain rendered/tappable regardless of the
 * current `value`, so re-selecting after a value is already set is the same
 * action as the initial selection (Req 1.7).
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.7, 6.1, 6.2
 */
export default function DocumentFormatSelector({ value, onSelect }: DocumentFormatSelectorProps) {
  const { colors } = useColors();

  return (
    <View className="flex gap-3">
      {FORMAT_OPTIONS.map((option) => {
        const isSelected = value === option.format;
        const Icon = option.icon;

        return (
          <TouchableOpacity
            key={option.format}
            onPress={() => onSelect(option.format)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={option.title}
          >
            <Card
              className={[
                'rounded-2xl border shadow-none',
                isSelected ? 'border-accent bg-surface' : 'border-border bg-surface',
              ].join(' ')}
            >
              <Card.Body className="flex-row items-center gap-3">
                <Icon
                  size={24}
                  color={isSelected ? colors.primary : colors.textPrimary}
                />

                <View className="flex-1 gap-0.5">
                  <Card.Title className="text-foreground font-interSemiBold">
                    {option.title}
                  </Card.Title>
                  <Card.Description className="text-gray-500 text-sm font-inter">
                    {option.description}
                  </Card.Description>
                </View>
              </Card.Body>
            </Card>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
