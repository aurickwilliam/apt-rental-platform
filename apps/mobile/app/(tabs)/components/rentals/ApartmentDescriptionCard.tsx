import { View, Text } from 'react-native';
import { formatCurrency } from '@repo/utils';

import { Button } from 'heroui-native';

interface ApartmentDescriptionCardProps {
  apartmentName?: string;
  apartmentAddress?: string;
  leaseStartMonth?: string;
  leaseStartYear?: string;
  leaseEndMonth?: string;
  leaseEndYear?: string;
  monthlyRent?: number;
  onPressViewMore?: () => void;
}

export default function ApartmentDescriptionCard({
  apartmentName = 'Apartment Name',
  apartmentAddress = 'Apartment Address',
  leaseStartMonth = 'Start Month',
  leaseStartYear = 'Start Year',
  leaseEndMonth = 'End Month',
  leaseEndYear = 'End Year',
  monthlyRent = 0,
  onPressViewMore
}: ApartmentDescriptionCardProps) {

  const formattedMonthlyRent = formatCurrency(monthlyRent);

  return (
    <View className='w-full bg-surface rounded-3xl p-4 border border-border'>
      {/* Name and Address */}
      <View>
        <Text className='text-lg font-interSemiBold text-foreground'>
          {apartmentName}
        </Text>
        <Text className='text-sm font-inter text-foreground'>
          {apartmentAddress}
        </Text>
      </View>

      {/* Lease Duration */}
      <View className='flex-row mt-5'>
        {/* Start */}
        <View className='flex w-1/2'>
          <Text className='text-muted text-sm font-inter'>
            Lease Start
          </Text>
          <Text className='text-foreground text-base font-interMedium'>
            {`${leaseStartMonth} ${leaseStartYear}`}
          </Text>
        </View>

        {/* End */}
        <View className='flex w-1/2'>
          <Text className='text-muted text-sm font-inter'>
            Lease End
          </Text>
          <Text className='text-foreground text-base font-interMedium'>
            {`${leaseEndMonth} ${leaseEndYear}`}
          </Text>
        </View>
      </View>

      {/* Monthly Rent */}
      <View className='mt-5'>
        <Text className='text-muted text-sm font-inter'>
          Monthly Rent
        </Text>
        <Text className='text-foreground text-base font-interMedium'>
          {`₱ ${formattedMonthlyRent}`}
        </Text>
      </View>

      {/* Button to View More */}
      <View className='mt-5'>
        <Button
          variant="secondary"
          size="sm"
          onPress={onPressViewMore}
        >
          <Button.Label>
            View More Details
          </Button.Label>
        </Button>
      </View>
    </View>
  );
}
