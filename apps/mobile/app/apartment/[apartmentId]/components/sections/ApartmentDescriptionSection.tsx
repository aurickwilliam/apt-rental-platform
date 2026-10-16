import { useState } from 'react';
import { View, Text } from 'react-native';

import { IconBuilding } from '@tabler/icons-react-native';

import { Button } from "heroui-native"

import { useColors } from 'hooks/useTheme';
import SectionHeader from '@/components/display/SectionHeader';
import SectionCard from '../SectionCard';

type ApartmentDescriptionSectionProps = {
  description?: string | null;
};

// Lines shown before Read More.
const COLLAPSED_LINES = 10;

export default function ApartmentDescriptionSection({
  description,
}: ApartmentDescriptionSectionProps) {
  const { colors } = useColors();

  const [isReadMore, setIsReadMore] = useState(false);
  // Measured from the full text's layout, so Read More shows exactly when the
  // collapsed text is cut off (long paragraphs or many short lines alike).
  const [hasLongDescription, setHasLongDescription] = useState(false);
  const text = description?.trim() || 'The owner has not added a description yet.';

  return (
    <View className="gap-3">
      <View className="px-5">
        <SectionHeader
        icon={<IconBuilding size={26} color={colors.textPrimary} />}
        title="Everything About Your Apartment"
        className="p-0 mt-0"
        />
      </View>

      <SectionCard appearance="card">
        <Text
          numberOfLines={isReadMore ? undefined : COLLAPSED_LINES}
          ellipsizeMode='tail'
          className='text-foreground font-inter text-sm'
        >
          {text}
        </Text>

        {/* Invisible full copy, measured once to see if the text is cut off. */}
        <Text
          className='text-foreground font-inter text-sm absolute left-0 right-0 opacity-0'
          onTextLayout={(event) =>
            setHasLongDescription(event.nativeEvent.lines.length > COLLAPSED_LINES)
          }
          accessibilityElementsHidden
          importantForAccessibility='no-hide-descendants'
          pointerEvents='none'
        >
          {text}
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
      </SectionCard>
    </View>
  );
}
