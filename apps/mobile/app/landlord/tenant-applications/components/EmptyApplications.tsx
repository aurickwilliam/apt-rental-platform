import { View, Text } from 'react-native';
import { FileText } from 'lucide-react-native';
import { useColors } from '@/hooks/useTheme';

export default function EmptyApplications() {
  const { colors } = useColors();
  return (
    <View className="flex-1 items-center justify-center py-20">
      <View className="bg-surface rounded-full p-5 mb-4">
        <FileText size={32} color={colors.gray500} />
      </View>
      <Text className="text-foreground text-lg font-interSemiBold">
        No applications yet
      </Text>
      <Text className="text-gray-500 text-sm font-inter text-center mt-1">
        New tenant applications will appear here.
      </Text>
    </View>
  );
}
