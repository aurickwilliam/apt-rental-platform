import PillButton from 'components/buttons/PillButton';
import { View, Text } from 'react-native';
import { formatCurrency } from 'utils/formatCurrency';

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
    <View className='w-full bg-darkerWhite rounded-2xl p-4'>
      {/* Name and Address */}
      <View>
        <Text className='text-xl font-interSemiBold text-text'>
          {apartmentName}
        </Text>
        <Text className='text-base text-text'>
          {apartmentAddress}
        </Text>
      </View>

      {/* Lease Duration */}
      <View className='flex-row mt-5'>
        {/* Start */}
        <View className='flex w-1/2'>
          <Text className='text-text text-sm font-inter'>
            Lease Start
          </Text>
          <Text className='text-text text-base font-interMedium'>
            {`${leaseStartMonth} ${leaseStartYear}`}
          </Text>
        </View>

        {/* End */}
        <View className='flex w-1/2'>
          <Text className='text-text text-sm font-inter'>
            Lease End
          </Text>
          <Text className='text-text text-base font-interMedium'>
            {`${leaseEndMonth} ${leaseEndYear}`}
          </Text>
        </View>
      </View>

      {/* Monthly Rent */}
      <View className='mt-5'>
        <Text className='text-text text-sm font-inter'>
          Monthly Rent
        </Text>
        <Text className='text-text text-base font-interMedium'>
          {`₱ ${formattedMonthlyRent}`}
        </Text>
      </View>

      {/* Button to View More */}
      <View className='mt-5'>
        <PillButton 
          label={'View More Details'}      
          type='outline'
          size='sm'
          onPress={onPressViewMore}
        />
      </View>
    </View>
  );
}
