import { View, Text } from 'react-native'
import { Image } from 'expo-image'

import { Card, PressableFeedback } from 'heroui-native'

import { IconChevronRight, IconFileText } from '@tabler/icons-react-native'

import { useColors } from '@/hooks/useTheme'
import { isImageUri } from '../utils/fileType'

interface DocumentCardProps {
  filePath: string;
  label: string;
  onPress: () => void;
}

export default function DocumentCard({ filePath, label, onPress }: DocumentCardProps) {
  const { colors } = useColors();
  const isImage = isImageUri(filePath);

  return (
    <PressableFeedback onPress={onPress} className='w-[48%] rounded-3xl overflow-hidden'>
      <PressableFeedback.Highlight />
      <Card className='border border-border rounded-3xl p-0 shadow-none overflow-hidden'>
        <View className='w-full bg-gray-200 items-center justify-center' style={{ aspectRatio: 1 }}>
          {isImage ? (
            <Image
              source={{ uri: filePath }}
              style={{ width: '100%', height: '100%' }}
              contentFit='cover'
              cachePolicy='disk'
              transition={150}
            />
          ) : (
            <IconFileText size={40} color={colors.gray400} />
          )}
        </View>

        <Card.Body className='p-3 gap-0.5'>
          <Card.Title className='text-base text-foreground font-interMedium' numberOfLines={1}>
            {label}
          </Card.Title>

          <View className='flex-row items-center gap-0.5'>
            <Text className='text-xs text-muted'>
              Tap to View
            </Text>
            <IconChevronRight size={14} color={colors.gray400} />
          </View>
        </Card.Body>
      </Card>
    </PressableFeedback>
  )
}
