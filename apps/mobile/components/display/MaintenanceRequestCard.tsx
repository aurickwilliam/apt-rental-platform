import { View, Text } from 'react-native'

import PillButton from '../buttons/PillButton'

import { IconTool } from '@tabler/icons-react-native';

interface MaintenanceRequestCardProps {
  issueName: string;
  reportedDate: string;
  onUpdatePress: () => void;
}

export default function MaintenanceRequestCard({ issueName, reportedDate, onUpdatePress }: MaintenanceRequestCardProps) {
  return (
    <View className='w-full bg-white border border-grey-200 p-4 rounded-xl'>
      <View className='flex-row items-center justify-between'>
        <Text className='text-text font-poppinsMedium text-lg'>
          Maintenance Request
        </Text>

        <View className='flex-row items-center gap-2 bg-darkerWhite py-2 px-3 rounded-full'>
          <View className='rounded-full bg-yellowish-200 w-3 h-3'/>
          <Text className='text-text text-sm font-inter'>
            Pending
          </Text>
        </View>
      </View>

      <View className='mt-3'>
        <Text className='text-grey-500 text-base font-inter'>
          Name/Issue:
        </Text>
        <Text className='text-text text-base font-interMedium'>
          {issueName}
        </Text>
      </View>

      <View className='mt-3'>
        <Text className='text-grey-500 text-base font-inter'>
          Reported Date:
        </Text>
        <Text className='text-text text-base font-interMedium'>
          {reportedDate}
        </Text>
      </View>

      <View className='mt-3'>
        <PillButton
          label='Update Maintenance'
          size='sm'
          leftIconName={IconTool}
          onPress={onUpdatePress}
        />
      </View>
    </View>
  )
}