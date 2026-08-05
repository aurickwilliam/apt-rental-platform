import { View, Text, TouchableOpacity } from 'react-native'
import { Image } from 'expo-image'

import { IconChevronRight } from '@tabler/icons-react-native'

import { useColors } from '@/hooks/useTheme'

interface DocumentCardProps {
  image: string;
  label: string;
  onPress: () => void;
}

export default function DocumentCard({ image, label, onPress }: DocumentCardProps) {
  const { colors } = useColors();

  return (
    <TouchableOpacity
      className='w-[48%]'
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View className='bg-surface border border-border rounded-3xl shadow-none overflow-hidden'>
        <View className='w-full bg-gray-200'>
          <Image
            source={{ uri: image }}
            style={{ width: '100%', aspectRatio: 1 }}
            contentFit='cover'
            cachePolicy='disk'
            transition={150}
          />
        </View>

        <View className='p-3 gap-0.5'>
          <Text className='text-base text-foreground font-interMedium' numberOfLines={1}>
            {label}
          </Text>

          <View className='flex-row items-center gap-0.5'>
            <Text className='text-xs text-muted'>
              Tap to view
            </Text>
            <IconChevronRight size={14} color={colors.gray400} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}