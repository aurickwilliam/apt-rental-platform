import { View, Text } from 'react-native'

import PillButton from 'components/buttons/PillButton';

import { COLORS } from '@repo/constants';

import { 
  IconFileUpload,
  IconPhoto,
  IconCamera,
} from '@tabler/icons-react-native'

interface UploadImageFieldProps {
  label: string;
  placeholder?: string;
  onChange?: (uri: string) => void;
  value?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

export default function UploadImageField({
  label,
  placeholder,
  onChange,
  value,
  disabled,
  error,
  required,
}: UploadImageFieldProps) {

  // TODO: implement image upload functionality using expo-image-picker or similar library
  
  return (
    <View className='w-full flex-col gap-2'>
      {/* Label Text */}
      <View className='flex-row items-center justify-between'>
        <Text className='text-base font-interMedium text-text'>
          {label}
        </Text>

        {
          required &&
          <Text className='text-sm font-interMedium text-redHead-200'>
            *Required
          </Text>
        }
      </View>

      {/* Uploaded Image Area */}
      <View className='w-full h-52 bg-white rounded-xl border border-gray-300 items-center justify-center'>
        <View className='flex gap-3 items-center justify-center'>
          <IconFileUpload 
            size={64} 
            color={COLORS.mediumGrey}
            strokeWidth={1}
          />
          <Text className='text-center text-grey-400 font-interMedium'>
            No documents uploaded yet.
          </Text>
        </View>
      </View> 

      {/* Error Message */}
      {
        error &&
        <Text className='text-base text-redHead-200 font-inter mt-1'>
          {error}
        </Text>
      }

      {/* Buttons */}
      <View className='flex-1 flex-row gap-4 mt-3'>
        <View className='flex-1'>
          <PillButton 
            label={'Use Existing Photo'}    
            size='sm'        
            type='secondary'
            isFullWidth
            leftIconName={IconPhoto}
            onPress={() => {}}
          />
        </View>
        <View className='flex-1'>
          <PillButton 
            label={'Take Photo'}   
            size='sm'         
            isFullWidth
            leftIconName={IconCamera}
            onPress={() => {}}
          />
        </View>
      </View>
    </View>
  )
}