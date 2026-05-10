import { useState } from 'react';
import { View, Text } from 'react-native';
import { IconBuildingCommunity } from '@tabler/icons-react-native';

import PillButton from 'components/buttons/PillButton';
import { COLORS } from '@repo/constants';

type ApartmentDescriptionSectionProps = {
  description?: string | null;
};

export default function ApartmentDescriptionSection({
  description,
}: ApartmentDescriptionSectionProps) {
  const [isReadMore, setIsReadMore] = useState(false);
  const hasLongDescription =
    !!description && description.split(' ').length > 50;

  return (
    <>
      <View className='mt-5 px-5 flex-row items-center gap-2'>
        <IconBuildingCommunity size={26} color={COLORS.text} />
        <Text className='font-poppinsSemiBold text-xl text-text'>
          Everything About Your Apartment
        </Text>
      </View>

      <View className='mt-3 mx-5 p-4 bg-darkerWhite rounded-2xl'>
        <Text 
          numberOfLines={isReadMore ? undefined : 10}
          ellipsizeMode='tail'
        >
          {description}
        </Text>

        {hasLongDescription && (
          <View className='mt-5'>
            <PillButton
              label={isReadMore ? 'Read Less' : 'Read More'}
              type='outline'
              size='sm'
              onPress={() => setIsReadMore((prev) => !prev)}
            />
          </View>
        )}
      </View>
    </>
  );
}
