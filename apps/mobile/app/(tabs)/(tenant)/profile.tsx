import { View, Text, ScrollView, Image } from 'react-native'

import { COLORS } from "../../../constants/colors";
import { IMAGES } from '../../../constants/images';

import {
  IconId,
  IconCircleCheckFilled,
  IconExclamationCircleFilled,
  IconXboxXFilled,
  IconProps,
  IconCamera,
} from '@tabler/icons-react-native';
import PillButton from 'components/buttons/PillButton';

export default function Profile() {

  // Change this to fetch user's photo
  const backgroundPhotoUri = IMAGES.sampleBackgroundPhoto;
  const profilePhotoUri = IMAGES.sampleProfilePicture;

  // Change of Status
  const accountStatus = 'verified' as 'verified' | 'pending' | 'rejected'; 
  const rejectedReason = 'Your submitted documents were not clear. Please resubmit clear copies of your ID and proof of income for verification.';
  const dateVerified = 'June 15, 2024';

  type StatusStyle = {
    [key in typeof accountStatus]: {
      text: string;
      style: string;
      icon: React.ComponentType<IconProps>;
      iconColor: string;
    }
  }

  const statusStyle: StatusStyle = {
    verified: {
      text: 'Verified Tenant',
      style: 'text-greenHulk-200',
      icon: IconCircleCheckFilled,
      iconColor: COLORS.greenHulk
    },
    pending: {
      text: 'Pending Verification',
      style: 'text-yellowish-200',
      icon: IconExclamationCircleFilled,
      iconColor: COLORS.yellowish
    },
    rejected: {
      text: 'Rejected',
      style: 'text-redHead-200',
      icon: IconXboxXFilled,
      iconColor: COLORS.redHead
    }
  }

  const backgroundColor = backgroundPhotoUri ? COLORS.transparent : COLORS.primary;
  const Icon = statusStyle[accountStatus].icon;

  return (
    <ScrollView 
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      className='bg-darkerWhite flex-1'
    >
      <View className='relative h-[28rem]'>
        {/* Background Photo */}
        <View 
          className='w-full h-72' 
          style={{ backgroundColor: backgroundColor }}
        >
          {
            backgroundPhotoUri && (
              <Image 
                source={backgroundPhotoUri}
                style={{ width: '100%', height: '100%' }}
              />
            )
          }
        </View>

        {/* Profile Picture */}
        <View 
          className='absolute bottom-0 
            left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2'
        >
          <View 
            className='size-56 rounded-full overflow-hidden border-[6px] border-primary mb-5'
          >
            <Image 
              source={profilePhotoUri}
              style={{ width: '100%', height: '100%'}}
            />
          </View>

          {/* Name and Email */}
          <View className='flex items-center justify-center'>
            <Text className='text-text text-2xl font-poppinsMedium'>
              Jonathan Ma
            </Text>
            <Text className='text-grey-500 text-lg font-inter'>
              johndoe@gmail.com
            </Text>
          </View>
        </View>
      </View>

      {/* Verification Status */}
      <View className='bg-white mt-10 mx-5 p-4 rounded-2xl'>
        <View className='flex-row gap-3 items-center'>
          <IconId 
            size={24}
            color={COLORS.text}
          />

          <Text className='text-text text-lg font-poppinsMedium'>
            Verification Status
          </Text>
        </View>
        
        {/* Status */}
        <View className='flex-row items-center mt-4 gap-2'>
          <Icon
            size={26} 
            color={statusStyle[accountStatus].iconColor} 
          />
          <Text className={`text-xl ${statusStyle[accountStatus].style} font-interMedium`}>
            {statusStyle[accountStatus].text}
          </Text>
        </View>
        
        {/* If Rejected */}
        {
          accountStatus === 'rejected' && (
            <>
              <Text className='text-redHead-200 mt-3 font-inter mb-5'>
                Reason: {rejectedReason}
              </Text>

              <PillButton 
                label='Re-Upload Photos' 
                isFullWidth
                size='sm'
                leftIconName={IconCamera}
              />
            </>
          )
        }

        {/* If Pending */}
        {
          accountStatus === 'pending' && (
            <Text className='text-grey-400 mt-3 font-inter'>
              Your documents are currently under review. We will notify you once the verification process is complete.
            </Text>
          )
        }

        {/* If Verified */}
        {
          accountStatus === 'verified' && (
            <>
              <Text className='text-grey-400 mt-3 font-inter'>
                You have successfully been verified as a tenant. You can now apply for rental properties on our platform.
              </Text>

              <Text className='text-grey-400 mt-3 font-inter'>
                Last Verified: {dateVerified}
              </Text>
            </>
          )
        }
      </View>
      
      {/* Profile Options */}
      

    </ScrollView>
  )
}