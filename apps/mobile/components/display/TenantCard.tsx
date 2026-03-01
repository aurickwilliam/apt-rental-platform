import { View, Text, TouchableOpacity, Image } from 'react-native'

import PillButton from '../buttons/PillButton';

import { 
  IconMail, 
  IconPhone,
  IconFileText,
  IconMessage,
} from '@tabler/icons-react-native';

interface TenantCardProps {
  fullName: string;
  email: string;
  phoneNumber: string;
  profilePictureUrl: string;
  onPress: () => void;
  leaseStartMonthYear: string;
  leaseEndMonthYear: string;
  onMessagePress?: () => void;
  onDocumentsPress?: () => void;
}

export default function TenantCard({
  fullName,
  email,
  phoneNumber,
  profilePictureUrl,
  onPress,
  leaseStartMonthYear,
  leaseEndMonthYear,
  onMessagePress,
  onDocumentsPress,
}: TenantCardProps) {

  return (
    <TouchableOpacity
      className='bg-white border border-grey-200 rounded-xl p-4'
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View className='flex-row items-start gap-4'>
        {/* Profile Picture */}
        <View className="w-36 h-36 rounded-xl overflow-hidden border border-grey-300">
          <Image
            source={{ uri: profilePictureUrl }}
            style={{ width: '100%', height: '100%' }}
          />
        </View>

        
        <View className='flex gap-2'>
          <Text className="font-interSemiBold text-lg text-text">
            {fullName}
          </Text>

          <View className="flex gap-1">
            <View className="flex-row items-center gap-2">
              <IconMail size={20} color="#999" />
              <Text className="text-sm text-grey-500 font-inter">
                {email}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <IconPhone size={20} color="#999" />
              <Text className="text-sm text-grey-500 font-inter">
                {phoneNumber}
              </Text>
            </View>
          </View>

          <View className="flex items-start">
            <Text className="text-sm text-grey-500 font-inter">
              Lease Duration:
            </Text>

            <Text className='text-text text-sm font-interMedium'>
              {leaseStartMonthYear} - {leaseEndMonthYear}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className='flex-row flex-1 items-center gap-5 mt-3'>
        <View className='flex-1'>
          <PillButton 
            label='Documents'
            size='sm'
            type='outline'
            leftIconName={IconFileText}
            onPress={onDocumentsPress}
          />
        </View>

        <View className='flex-1'>
          <PillButton 
            label='Message'
            size='sm'
            type='outline'
            leftIconName={IconMessage}
            onPress={onMessagePress}
          />
        </View>
      </View>
    </TouchableOpacity>
  )
}