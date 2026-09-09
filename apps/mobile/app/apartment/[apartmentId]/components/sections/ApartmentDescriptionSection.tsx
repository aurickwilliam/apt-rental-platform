import { useState } from 'react';
import { View, Text } from 'react-native';

import { IconBuilding } from '@tabler/icons-react-native';

import { Button } from "heroui-native"

import { useColors } from 'hooks/useTheme';
import SectionHeader from '@/components/display/SectionHeader';

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
      <SectionHeader
        icon={<IconBuilding size={26} color={colors.textPrimary} />}
        title="Everything About Your Apartment"
        className="mt-5 px-5"
      />

      <View className='mt-3 mx-5 p-4 bg-surface rounded-2xl border border-border'>
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
