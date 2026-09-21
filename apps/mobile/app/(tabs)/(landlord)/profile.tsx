import { View, ScrollView, Platform } from 'react-native'
import { useRouter } from 'expo-router';
import type React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '@repo/supabase';

import { IconUserEdit, IconFileText, IconSettings, IconLogout } from '@tabler/icons-react-native';

import { Button, ListGroup, Separator } from 'heroui-native';

import { useProfile } from 'hooks/auth';
import { useLatestVerification } from 'hooks/verification';
import { useColors } from '@/hooks/useTheme';
import { clearQueryClient } from '@/utils/queryClient';
import { formatDate } from '@repo/utils';

import ProfileHeader from '../components/profile/ProfileHeader';
import VerificationStatus from '../components/profile/VerificationStatus';
import CompleteProfileCard from '../components/profile/CompleteProfileCard';

import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_BOTTOM_OFFSET } from '../components/CustomTabBar';

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, loading } = useProfile();
  const { colors } = useColors();

  const avatarInitials = `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`.toUpperCase();

  const backgroundPhotoUri = profile?.background_url ?? null;

  const accountStatus = (profile?.account_status ?? 'unverified') as 'verified' | 'pending' | 'rejected' | 'unverified';
  const { data: latestVerification } = useLatestVerification();
  const rejectedReason = latestVerification?.rejection_reason ?? undefined;
  const dateVerified = latestVerification?.reviewed_at
    ? formatDate(latestVerification.reviewed_at, 'long')
    : undefined;

  const handleLogout = async () => {
    clearQueryClient();
    await supabase.auth.signOut();
    router.replace('/(auth)/sign-in');
  };

  type ListItem = {
    title: string;
    icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
    onPress: () => void;
  };

  const listItems: ListItem[] = [
    {
      title: 'Edit Profile',
      icon: IconUserEdit,
      onPress: () => router.push('/edit-profile'),
    },
    {
      title: 'Document & IDs',
      icon: IconFileText,
      onPress: () => router.push('/document-id'),
    },
    {
      title: 'Settings',
      icon: IconSettings,
      onPress: () => router.push('/settings'),
    }
  ]

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      className='bg-background flex-1'
      contentContainerStyle={{
        paddingBottom:
          Platform.OS === 'android'
            ? FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_BOTTOM_OFFSET + insets.bottom + 24
            : 0,
      }}
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
        <ListGroup className="shadow-none border border-border">
          {listItems.map((item, index) => (
            <View key={index}>
              <ListGroup.Item onPress={item.onPress}>
                <ListGroup.ItemPrefix>
                  <item.icon size={22} color={colors.textPrimary} />
                </ListGroup.ItemPrefix>

                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle className='font-nunitoSemiBold'>
                    {item.title}
                  </ListGroup.ItemTitle>
                </ListGroup.ItemContent>

                <ListGroup.ItemSuffix />
              </ListGroup.Item>

              {index < listItems.length - 1 && (
                <Separator key={`sep-${index}`} className='mx-4' />
              )}
            </View>
          ))}
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
