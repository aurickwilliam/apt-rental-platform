import { View, Text, ScrollView, Image } from 'react-native'
import { useRouter } from 'expo-router';

import { COLORS } from "@repo/constants";

import { supabase } from '@repo/supabase';

import {
  IconId,
  IconCircleCheckFilled,
  IconExclamationCircleFilled,
  IconXboxXFilled,
  IconProps,
  IconCamera,
  IconUser,
  IconFileText,
  IconHeart,
  IconClock,
  IconCreditCard,
  IconSettings,
  IconLogout
} from '@tabler/icons-react-native';

import PillButton from 'components/buttons/PillButton';
import SettingOptionButton from 'components/buttons/SettingOptionButton';

import { useProfile } from '@/hooks/useProfile';

export default function Profile() {
  const router = useRouter();
  const { profile, loading } = useProfile();
  const avatarInitials = `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`.toUpperCase();

  const backgroundPhotoUri = profile?.background_url ?? null;

  // Change of Status
  const accountStatus = (profile?.account_status ?? 'unverified') as 'verified' | 'pending' | 'rejected' | 'unverified';
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
    },
    unverified: {                         
      text: 'Not Verified',
      style: 'text-grey-400',
      icon: IconExclamationCircleFilled,
      iconColor: COLORS.grey              
    }
  }

  const backgroundColor = backgroundPhotoUri ? COLORS.transparent : COLORS.grey;
  const Icon = statusStyle[accountStatus].icon;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/sign-in');
  };

  return (
    <ScrollView 
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      className='bg-darkerWhite flex-1'
    >
      <View className='relative h-[24rem]'>
        {/* Background Photo */}
        <View 
          className='w-full h-60' 
          style={{ backgroundColor: backgroundColor }}
        >
          {
            backgroundPhotoUri && (
              <Image 
                source={{ uri: backgroundPhotoUri }} 
                style={{ width: '100%', height: '100%' }}
              />
            )
          }
        </View>

        {/* Profile Picture */}
        <View 
          className='absolute top-24 left-0 right-0 items-center'
        >
          <View className='size-56 rounded-full overflow-hidden border-[6px] border-primary mb-5 bg-primary items-center justify-center'>
            {profile?.avatar_url ? (
              <Image 
                source={{ uri: profile.avatar_url }}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <View className='h-full w-full items-center justify-center'>
                <Text className='text-white text-7xl font-poppinsSemiBold text-center leading-none'>
                  {avatarInitials || 'U'}
                </Text>
              </View>
            )}
          </View>

          {/* Name and Email */}
          <View className='flex items-center justify-center'>
            <Text className='text-text text-2xl font-poppinsMedium'>
              {loading ? '...' : `${profile?.first_name} ${profile?.last_name}`}
            </Text>
            <Text className='text-grey-500 text-lg font-inter'>
              {loading ? '...' : profile?.email}
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
                label='Re-Apply for Verification' 
                isFullWidth
                size='sm'
                leftIconName={IconCamera}
                onPress={() => router.push('/(auth)/verify-account')}
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

        {/* If Unverified */}
        {accountStatus === 'unverified' && (
          <>
            <Text className='text-grey-400 my-3 font-inter'>
              Your account has not been verified yet. Please submit your documents to get verified.
            </Text>

            <PillButton
              label='Apply for Verification'
              isFullWidth
              size='sm'
              leftIconName={IconCamera}
              onPress={() => router.push('/(auth)/verify-account')}
            />
          </>
        )}
      </View>
      
      {/* Profile Options */}
      <View className='mt-5 px-5 flex gap-3 mb-20'>
        <SettingOptionButton 
          label='Edit Profile'
          iconName={IconUser}
          onPress={() => router.push('/tenant/edit-profile')}
        />
        <SettingOptionButton 
          label='Document & IDs'
          iconName={IconFileText}
          onPress={() => router.push('/document-id')}
        />
        <SettingOptionButton 
          label='Favorites'
          iconName={IconHeart}
          onPress={() => router.push('/tenant/favorites')}
        />
        <SettingOptionButton
          label='Payment History'
          iconName={IconClock}
          onPress={() => router.push('/tenant/payment/history')}
        />
        <SettingOptionButton
          label='Payment Methods'
          iconName={IconCreditCard}
          onPress={() => router.push('/tenant/payment/saved-methods')}
        />
        <SettingOptionButton
          label='Settings'
          iconName={IconSettings}
          onPress={() => router.push('/settings')}
        />
      </View>

      <View className='p-5'>
        <PillButton
          label='Logout'
          isFullWidth
          type='danger'
          leftIconName={IconLogout}
          onPress={handleLogout}
        />
      </View>

    </ScrollView>
  )
}