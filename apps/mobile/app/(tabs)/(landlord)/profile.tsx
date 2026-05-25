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
  IconSettings,
  IconLogout
} from '@tabler/icons-react-native';

import { Avatar, Button, Card, ListGroup, Separator } from 'heroui-native';

import { useProfile } from '@/hooks/useProfile';

export default function Profile() {
  const router = useRouter();
  const { profile, loading } = useProfile();
  const avatarInitials = `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`.toUpperCase();

  const backgroundPhotoUri = profile?.background_url ?? null;

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
      <View className='relative h-96'>
        {/* Background Photo */}
        <View
          className='w-full h-60'
          style={{ backgroundColor }}
        >
          {backgroundPhotoUri && (
            <Image
              source={{ uri: backgroundPhotoUri }}
              style={{ width: '100%', height: '100%' }}
            />
          )}
        </View>

        {/* Profile Picture */}
        <View className='absolute top-24 left-0 right-0 items-center'>
          <Avatar
            size="lg"
            color="accent"
            className="size-56 border-[6px] border-secondary mb-5"
            alt={`${profile?.first_name} ${profile?.last_name}`}
          >
            <Avatar.Image source={{ uri: profile?.avatar_url ?? '' }} />
            <Avatar.Fallback delayMs={200}>
              {avatarInitials || ''}
            </Avatar.Fallback>
          </Avatar>

          {/* Name and Email */}
          <View className='flex items-center justify-center'>
            <Text className='text-text text-2xl font-interSemiBold'>
              {loading ? '...' : `${profile?.first_name} ${profile?.last_name}`}
            </Text>
            <Text className='text-grey-500 text-lg font-inter'>
              {loading ? '...' : profile?.email}
            </Text>
          </View>
        </View>
      </View>

      {/* Verification Status */}
      <Card className='mt-10 mx-5'>
        <Card.Header className='flex-row gap-3 items-center pb-0'>
          <IconId size={24} color={COLORS.text} />
          <Card.Title className='text-text font-interSemiBold'>
            Verification Status
          </Card.Title>
        </Card.Header>

        <Card.Body className='gap-3 mt-3'>
          {/* Status Row */}
          <View className='flex-row items-center gap-2'>
            <Icon size={26} color={statusStyle[accountStatus].iconColor} />
            <Text className={`text-lg ${statusStyle[accountStatus].style} font-interMedium`}>
              {statusStyle[accountStatus].text}
            </Text>
          </View>

          {/* If Rejected */}
          {accountStatus === 'rejected' && (
            <>
              <Card.Description className='text-redHead-200 font-inter text-sm'>
                Reason: {rejectedReason}
              </Card.Description>
              <Button
                variant='primary'
                size='sm'
                onPress={() => router.push('/(auth)/verify-account')}
                className='w-full'
              >
                <IconCamera size={16} color='white' />
                <Button.Label>Re-Apply for Verification</Button.Label>
              </Button>
            </>
          )}

          {/* If Pending */}
          {accountStatus === 'pending' && (
            <Card.Description className='text-grey-400 font-inter text-sm'>
              Your documents are currently under review. We will notify you once the verification process is complete.
            </Card.Description>
          )}

          {/* If Verified */}
          {accountStatus === 'verified' && (
            <>
              <Card.Description className='text-grey-400 font-inter text-sm'>
                You have successfully been verified as a tenant. You can now apply for rental properties on our platform.
              </Card.Description>
              <Card.Description className='text-grey-400 font-inter text-sm'>
                Last Verified: {dateVerified}
              </Card.Description>
            </>
          )}

          {/* If Unverified */}
          {accountStatus === 'unverified' && (
            <>
              <Card.Description className='text-grey-400 font-inter text-sm'>
                Your account has not been verified yet. Please submit your documents to get verified.
              </Card.Description>
              <Button
                variant='primary'
                size='sm'
                onPress={() => router.push('/(auth)/verify-account')}
                className='w-full'
              >
                <IconCamera size={16} color='white' />
                <Button.Label>Apply for Verification</Button.Label>
              </Button>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Profile Options */}
      <View className='mt-5 px-5'>
        <ListGroup className="shadow-none">
          <ListGroup.Item onPress={() => router.push('/tenant/edit-profile')}>
            <ListGroup.ItemPrefix>
              <IconUser size={22} color={COLORS.text} />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle className='font-interMedium'>Edit Profile</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>

          <Separator className='mx-4' />

          <ListGroup.Item onPress={() => router.push('/document-id')}>
            <ListGroup.ItemPrefix>
              <IconFileText size={22} color={COLORS.text} />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle className='font-interMedium'>Document & IDs</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>

          <Separator className='mx-4' />

          <ListGroup.Item onPress={() => router.push('/settings')}>
            <ListGroup.ItemPrefix>
              <IconSettings size={22} color={COLORS.text} />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle className='font-interMedium'>Settings</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>
        </ListGroup>
      </View>

      <View className='p-5'>
        <Button
          onPress={handleLogout}
          variant='danger'
          size='md'
        >
          <IconLogout size={16} color='white' />
          <Button.Label>Logout</Button.Label>
        </Button>
      </View>
    </ScrollView>
  )
}