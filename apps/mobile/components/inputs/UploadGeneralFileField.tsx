import { View, Text } from 'react-native'

import PillButton from 'components/buttons/PillButton';

import { COLORS } from '@repo/constants';

import { IconFileUpload } from '@tabler/icons-react-native'

interface UploadGeneralFileFieldProps {
  label: string;
  placeholder?: string;
  onChange?: (uri: string) => void;
  value?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

export default function UploadGeneralFileField({
  label,
  placeholder,
  onChange,
  value,
  disabled,
  error,
  required,
}: UploadGeneralFileFieldProps) {

  // TODO: implement file upload functionality using expo-document-picker or similar library

  return (
    <View className='w-full flex-col gap-2'>
      {/* Label Text */}
      <View className='flex-row items-center justify-between'>
        <Text className='text-base font-interMedium text-text flex-1'>
          {label}
        </Text>

        <Text className='text-base font-inter text-redHead-200'>
          *Required
        </Text>
      </View>

      {/* Uploaded File Area */}
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
            label={'Upload a File'}    
            size='sm'        
            type='secondary'
            isFullWidth
            leftIconName={IconFileUpload}
            onPress={() => {}}
          />
        </View>
      </View>
    </View>
  )
}