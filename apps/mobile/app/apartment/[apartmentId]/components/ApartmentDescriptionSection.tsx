import { useState } from 'react';
import { View, Text } from 'react-native';

import { Building } from 'lucide-react-native';

import { Button } from "heroui-native"

import { useColors } from '@/hooks/useTheme';

type ApartmentDescriptionSectionProps = {
  description?: string | null;
};

export default function ApartmentDescriptionSection({
  description,
}: ApartmentDescriptionSectionProps) {
  const { colors } = useColors();

  const [isReadMore, setIsReadMore] = useState(false);
  const hasLongDescription =
    !!description && description.split(' ').length > 50;

  return (
    <>
      <View className='mt-5 px-5 flex-row items-center gap-2'>
        <Building size={26} color={colors.textPrimary} />
        <Text className='font-interSemiBold text-lg text-foreground'>
          Everything About Your Apartment
        </Text>
      </View>

      <View className='mt-3 mx-5 p-4 bg-surface-secondary rounded-2xl'>
        <Text
          numberOfLines={isReadMore ? undefined : 10}
          ellipsizeMode='tail'
          className='text-foreground font-inter text-sm'
        >
          {description}
        </Text>

        {hasLongDescription && (
          <View className='mt-5'>
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => setIsReadMore((prev) => !prev)}
            >
              <Button.Label>
                {isReadMore ? 'Read Less' : 'Read More'}
              </Button.Label>
            </Button>
          </View>
        )}
      </View>
    </>
  );
}
