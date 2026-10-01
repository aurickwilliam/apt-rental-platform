import { View, ScrollView, Platform } from 'react-native'
import { useRouter } from 'expo-router';
import type React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '@repo/supabase';

import { IconUserEdit, IconFileText, IconSettings, IconLogout, IconLock } from '@tabler/icons-react-native';

import { Button, ListGroup, Separator, useToast } from 'heroui-native';

import { useProfile } from 'hooks/auth';
import { useLatestVerification } from 'hooks/verification';
import { useColors } from '@/hooks/useTheme';
import { clearQueryClient } from '@/utils/queryClient';
import { formatDate } from '@repo/utils';

import ProfileHeader from '../components/profile/ProfileHeader';
import VerificationStatus from '../components/profile/VerificationStatus';
import CompleteProfileCard from '../components/profile/CompleteProfileCard';
import PortalSwitcher from '../components/profile/PortalSwitcher';

import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_BOTTOM_OFFSET } from '../components/CustomTabBar';

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, loading } = useProfile();
  const { colors } = useColors();

  const avatarInitials = `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`.toUpperCase();

  const backgroundPhotoUri = profile?.background_url ?? null;

  const accountStatus = (profile?.account_status ?? 'unverified') as 'verified' | 'pending' | 'rejected' | 'unverified';
  const { toast } = useToast();
  const isPassportLocked = accountStatus !== 'verified';
  const passportLockDescription =
    accountStatus === 'pending'
      ? 'Available once verification is approved'
      : accountStatus === 'rejected'
        ? 'Re-verify to restore access'
        : 'Verify your account to unlock';
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
    locked?: boolean;
    description?: string;
  };

  const handleLockedPassportPress = () => {
    toast.show({
      variant: 'warning',
      label: 'APT Passport locked',
      description: passportLockDescription,
    });
  };

  const listItems: ListItem[] = [
    {
      title: 'Edit Profile',
      icon: IconUserEdit,
      onPress: () => router.push('/edit-profile'),
    },
    {
      title: 'APT Passport',
      icon: IconFileText,
      onPress: () => isPassportLocked ? handleLockedPassportPress() : router.push('/document-id'),
      locked: isPassportLocked,
      description: isPassportLocked ? passportLockDescription : undefined,
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
        role="landlord"
      />

      <PortalSwitcher authUserId={profile?.user_id} roles={profile?.roles ?? []} currentPortal="landlord" />

      {!profile?.mobile_number && (
        <CompleteProfileCard
          email={profile?.email ?? ''}
          role="landlord"
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
              <ListGroup.Item onPress={item.onPress} className={item.locked ? 'opacity-50' : undefined}>
                <ListGroup.ItemPrefix>
                  <item.icon size={22} color={colors.textPrimary} />
                </ListGroup.ItemPrefix>

                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle className='font-nunitoSemiBold'>
                    {item.title}
                  </ListGroup.ItemTitle>
                  {item.description ? (
                    <ListGroup.ItemDescription className='text-muted text-xs font-inter'>
                      {item.description}
                    </ListGroup.ItemDescription>
                  ) : null}
                </ListGroup.ItemContent>

                {item.locked ? (
                  <ListGroup.ItemSuffix>
                    <IconLock size={18} color={colors.gray400} />
                  </ListGroup.ItemSuffix>
                ) : (
                  <ListGroup.ItemSuffix />
                )}
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
