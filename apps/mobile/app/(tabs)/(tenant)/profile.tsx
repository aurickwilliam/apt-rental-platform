import { View, ScrollView } from 'react-native'
import { useRouter } from 'expo-router';

import { COLORS } from "@repo/constants";

import { supabase } from '@repo/supabase';

import {
  IconUser,
  IconFileText,
  IconHeart,
  IconClock,
  IconCreditCard,
  IconSettings,
  IconLogout
} from '@tabler/icons-react-native';

import { Button, ListGroup, Separator } from "heroui-native";

import { useProfile } from '@/hooks/useProfile';

import { ProfileHeader } from '../components/profile/ProfileHeader';
import { VerificationStatus } from '../components/profile/VerificationStatus';
import CompleteProfileCard from '../components/profile/CompleteProfileCard';

export default function Profile() {
  const router = useRouter();
  const { profile, loading } = useProfile();
  
  const avatarInitials =
    `${profile?.first_name?.[0] ?? ""}${profile?.last_name?.[0] ?? ""}`.toUpperCase();

  const backgroundPhotoUri = profile?.background_url ?? null;

  // Change of Status
  const accountStatus = (profile?.account_status ?? 'unverified') as 'verified' | 'pending' | 'rejected' | 'unverified';
  const rejectedReason = 'Your submitted documents were not clear. Please resubmit clear copies of your ID and proof of income for verification.';
  const dateVerified = 'June 15, 2024';

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

      <ProfileHeader 
        backgroundPhotoUri={backgroundPhotoUri}
        avatarUrl={profile?.avatar_url}
        firstName={profile?.first_name}
        lastName={profile?.last_name}
        email={profile?.email}
        avatarInitials={avatarInitials}
        loading={loading}
        role={profile?.role}
      />

      {!profile?.mobile_number && (
        <CompleteProfileCard
          email={profile?.email ?? ''}
          role={profile?.role ?? ''}
          firstName={profile?.first_name ?? ''}
          lastName={profile?.last_name ?? ''}
        />
      )}

      {/* Verification Status */}
      <VerificationStatus 
        accountStatus={accountStatus}
        rejectedReason={rejectedReason}
        dateVerified={dateVerified}
      />
      
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

          <ListGroup.Item onPress={() => router.push('/tenant/favorites')}>
            <ListGroup.ItemPrefix>
              <IconHeart size={22} color={COLORS.text} />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle className='font-interMedium'>Favorites</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>

          <Separator className='mx-4' />

          <ListGroup.Item onPress={() => router.push('/tenant/payment/history')}>
            <ListGroup.ItemPrefix>
              <IconClock size={22} color={COLORS.text} />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle className='font-interMedium'>Payment History</ListGroup.ItemTitle>
            </ListGroup.ItemContent>
            <ListGroup.ItemSuffix />
          </ListGroup.Item>

          <Separator className='mx-4' />

          <ListGroup.Item onPress={() => router.push('/tenant/payment/saved-methods')}>
            <ListGroup.ItemPrefix>
              <IconCreditCard size={22} color={COLORS.text} />
            </ListGroup.ItemPrefix>
            <ListGroup.ItemContent>
              <ListGroup.ItemTitle className='font-interMedium'>Payment Methods</ListGroup.ItemTitle>
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
          <Button.Label>
            Logout
          </Button.Label>
        </Button>
      </View>

    </ScrollView>
  )
}