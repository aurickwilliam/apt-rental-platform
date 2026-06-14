import { View, ScrollView } from 'react-native'
import { useRouter } from 'expo-router';

import { supabase } from '@repo/supabase';

import {
  UserPen,
  FileText,
  Settings,
  LogOut,
  LucideIcon,
} from 'lucide-react-native';

import { Button, ListGroup, Separator } from 'heroui-native';

import { useProfile } from '@/hooks/useProfile';
import { useColors } from '@/hooks/useTheme';

import { ProfileHeader } from '../components/profile/ProfileHeader';
import { VerificationStatus } from '../components/profile/VerificationStatus';
import CompleteProfileCard from '../components/profile/CompleteProfileCard';

export default function Profile() {
  const router = useRouter();
  const { profile, loading } = useProfile();
  const { colors } = useColors();

  const avatarInitials = `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`.toUpperCase();

  const backgroundPhotoUri = profile?.background_url ?? null;

  const accountStatus = (profile?.account_status ?? 'unverified') as 'verified' | 'pending' | 'rejected' | 'unverified';
  const rejectedReason = 'Your submitted documents were not clear. Please resubmit clear copies of your ID and proof of income for verification.';
  const dateVerified = 'June 15, 2024';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/sign-in');
  };

  type ListItem = {
    title: string;
    icon: LucideIcon;
    onPress: () => void;
  };

  const listItems: ListItem[] = [
    {
      title: 'Edit Profile',
      icon: UserPen,
      onPress: () => router.push('/tenant/edit-profile'),
    },
    {
      title: 'Document & IDs',
      icon: FileText,
      onPress: () => router.push('/document-id'),
    },
    {
      title: 'Settings',
      icon: Settings,
      onPress: () => router.push('/settings'),
    }
  ]

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      className='bg-background flex-1'
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
                  <ListGroup.ItemTitle className='font-interMedium'>
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
          <LogOut size={16} color='white' />
          <Button.Label>Logout</Button.Label>
        </Button>
      </View>
    </ScrollView>
  )
}