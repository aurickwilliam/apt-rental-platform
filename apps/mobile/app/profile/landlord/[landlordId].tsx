import { View, Text, Image, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native'
import { useCallback, useMemo, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useLocalSearchParams, useRouter } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import ApartmentCard from 'components/cards/ApartmentCard'

import { Button, Avatar } from "heroui-native"

import { supabase } from '@repo/supabase'

import { useColors } from 'hooks/useTheme'
import { useLandlordStats } from 'hooks/useLandlordStats'

import {
  Flag,
  MessageCircleMore,
  BadgeCheck,
} from 'lucide-react-native';

type LandlordProfileData = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  mobile_number: string | null;
  avatar_url: string | null;
  background_url: string | null;
  account_status: string | null;
  street_address: string | null;
  barangay: string | null;
  city: string | null;
  province: string | null;
  created_at: string | null;
};
type LandlordListing = ApartmentCardProps;

export default function PublicLandlordProfile() {
  const { landlordId, apartmentId } = useLocalSearchParams<{ 
    landlordId?: string | string[],
    apartmentId?: string | string[],
  }>();
  const router = useRouter();
  const { colors } = useColors();

  const resolvedLandlordId = useMemo(
    () => (Array.isArray(landlordId) ? landlordId[0] : landlordId),
    [landlordId]
  );

  const resolvedApartmentId = useMemo(
    () => (Array.isArray(apartmentId) ? apartmentId[0] : apartmentId),
    [apartmentId]
  );

  const [profile, setProfile] = useState<LandlordProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [landlordListings, setLandlordListings] = useState<LandlordListing[]>([]);

  const { stats, loading: statsLoading, refetch: refetchStats } = useLandlordStats(resolvedLandlordId);

  const fetchProfile = useCallback(async () => {
    if (!resolvedLandlordId) {
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);

    const { data, error } = await supabase
      .from('users')
      .select(
        'id, first_name, last_name, email, mobile_number, avatar_url, background_url, account_status, street_address, barangay, city, province, created_at'
      )
      .eq('id', resolvedLandlordId)
      .returns<LandlordProfileData>()
      .single();

    if (error) {
      console.error('Error fetching landlord profile:', error);
    } else {
      setProfile(data);
    }

    setProfileLoading(false);
  }, [resolvedLandlordId]);

  const fetchListings = useCallback(async () => {
    if (!resolvedLandlordId) {
      setListingsLoading(false);
      return;
    }

    setListingsLoading(true);

    const { data, error } = await supabase
      .from('apartments')
      .select(
        `
          id,
          name,
          monthly_rent,
          no_bedrooms,
          no_bathrooms,
          area_sqm,
          average_rating,
          barangay,
          city,
          apartment_images (
            url,
            is_cover,
            created_at
          )
        `
      )
      .eq('landlord_id', resolvedLandlordId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching landlord listings:', error);
      setLandlordListings([]);
      setListingsLoading(false);
      return;
    }

    const mapped = (data ?? []).map((apt: any): LandlordListing => {
      const images = apt.apartment_images ?? [];
      const thumbnailUrl =
        images.find((img: any) => img.is_cover)?.url ??
        images
          .slice()
          .sort(
            (a: any, b: any) =>
              new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
          )[0]?.url ??
        undefined;

      return {
        id: apt.id,
        thumbnail: thumbnailUrl ? { uri: thumbnailUrl } : undefined,
        name: apt.name,
        location: `${apt.barangay}, ${apt.city}`,
        ratings: apt.average_rating?.toFixed(1) ?? '0.0',
        monthlyRent: apt.monthly_rent,
        noBedroom: apt.no_bedrooms,
        noBathroom: apt.no_bathrooms,
        areaSqm: apt.area_sqm,
        isFavorite: false,
        isGrid: true,
      };
    });

    setLandlordListings(mapped);
    setListingsLoading(false);
  }, [resolvedLandlordId]);

  useFocusEffect(
    useCallback(() => {
      void fetchProfile();
      void fetchListings();
      void refetchStats();
    }, [fetchProfile, fetchListings, refetchStats])
  );

  const fullName = useMemo(() => {
    const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim();
    return name || 'Landlord';
  }, [profile?.first_name, profile?.last_name]);

  const memberSince = useMemo(() => {
    if (!profile?.created_at) return 'N/A';
    const parsed = new Date(profile.created_at);
    if (Number.isNaN(parsed.getTime())) return 'N/A';
    return parsed.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [profile?.created_at]);

  const getFirstName = (name: string) => name.split(' ')[0] || 'Landlord';

  const backgroundPhotoUri = profile?.background_url ? { uri: profile.background_url } : undefined;

  // TODO: Implement function to handle report landlord
  const handleReportLandlord = () => {
    console.log("Report Landlord Pressed");
  }

  const handleMessageLandlord = () => {
    if (!resolvedLandlordId) return;

    // Use the same ID format as ApartmentScreen when apartmentId is available,
    // otherwise fall back to the generic one
    const conversationId = resolvedApartmentId
      ? `inquiry-${resolvedApartmentId}-${resolvedLandlordId}`
      : `inquiry-${resolvedLandlordId}`;

    router.push({
      pathname: '/chat/[conversationId]',
      params: {
        conversationId,
        otherUserId: resolvedLandlordId,
        otherUserName: fullName || 'Landlord',
        otherUserAvatar: profile?.avatar_url ?? '',
        otherUserPhoneNumber: profile?.mobile_number ?? '',
        ...(resolvedApartmentId ? { apartmentId: resolvedApartmentId } : {}),
      },
    });
  }

  const backgroundColor = backgroundPhotoUri ? colors.surface : colors.primary;
  const isVerified = profile?.account_status === 'verified';
  const isLoading = profileLoading || listingsLoading || statsLoading;

  const avatarInitials = `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`.toUpperCase();


  return (
    <ScreenWrapper
      scrollable
      header={<StandardHeader title="Landlord Profile" />}
    >
      {/* Header Information */}
      <View className="relative h-80">
        {/* Background Photo */}
        <View
          className="w-full h-40"
          style={{ backgroundColor: backgroundColor }}
        >
          {backgroundPhotoUri && (
            <Image
              source={backgroundPhotoUri}
              style={{ width: "100%", height: "100%" }}
            />
          )}
        </View>

        {/* Profile Picture */}
        <View className="absolute top-8 left-0 right-0 items-center">
          <Avatar
            size="lg"
            color="accent"
            className="size-50 border-4 border-surface mb-5"
            alt={`${profile?.first_name} ${profile?.last_name}`}
          >
            <Avatar.Image source={{ uri: profile?.avatar_url ?? "" }} />
            <Avatar.Fallback delayMs={200}>
              <Text className="text-accent text-3xl font-interMedium">
                {avatarInitials || "U"}
              </Text>
            </Avatar.Fallback>
          </Avatar>

          {/* Name and Email */}
          <View className="flex items-center justify-center">
            <Text className="text-foreground text-2xl font-interSemiBold">
              {fullName}
            </Text>
            <Text className="text-gray-500 text-lg font-inter">
              {profile?.email ?? "N/A"}
            </Text>
          </View>
        </View>
      </View>

      {/* Landlord Stats */}
      <View className="mx-5 mt-5 p-4 border-t border-b border-gray-300 flex-row items-center justify-between">
        {/* No. of Properties */}
        <View className="flex items-center gap-1 w-1/3">
          <Text className="text-base text-gray-500 font-inter">No. of</Text>
          <Text className="text-3xl text-foreground font-interMedium">
            {stats.totalProperties}
          </Text>
          <Text className="text-base text-gray-500 font-interMedium">
            Properties
          </Text>
        </View>

        <View className="w-px h-full bg-gray-300" />

        <View className="flex items-center gap-1 w-1/3">
          <Text className="text-base text-gray-500 font-inter">Ratings</Text>
          <Text className="text-3xl text-secondary font-interMedium">
            {stats.averageRating}/5
          </Text>
          <Text className="text-base text-gray-500 font-interMedium">
            Average
          </Text>
        </View>

        <View className="w-px h-full bg-grey-300" />

        <View className="flex items-center gap-1 w-1/3">
          <Text className="text-base text-gray-500 font-inter">Identity</Text>
          <BadgeCheck
            size={32}
            color={isVerified ? colors.primary : colors.gray500}
          />

          <Text className="text-base text-gray-500 font-interMedium">
            {isVerified ? "Verified" : "Unverified"}
          </Text>
        </View>
      </View>

      {/* Personal Information */}
      <View className="mt-8 mx-5">
        <View className="flex">
          <Text className="text-xs text-gray-500 font-inter">
            Location/Based In
          </Text>

          <Text className="text-base text-foreground font-interMedium">
            {[profile?.city, profile?.province].filter(Boolean).join(", ") ||
              "N/A"}
          </Text>
        </View>

        <View className="flex-row items-center mt-5">
          <View className="flex w-1/2">
            <Text className="text-xs text-gray-500 font-inter">
              Contact Number
            </Text>
            <Text className="text-base text-foreground font-interMedium">
              {profile?.mobile_number ?? "N/A"}
            </Text>
          </View>

          <View className="flex w-1/2">
            <Text className="text-xs text-gray-500 font-inter">
              Member Since
            </Text>
            <Text className="text-base text-foreground font-interMedium">
              {memberSince}
            </Text>
          </View>
        </View>

        <View className="mt-5">
          <Button
            size="sm"
            variant="outline"
            onPress={handleMessageLandlord}
            isDisabled={!resolvedLandlordId}
          >
            <MessageCircleMore size={20} color={colors.gray500} />
            <Button.Label>Message</Button.Label>
          </Button>
        </View>
      </View>

      {/* Listings */}
      <View className="mt-8">
        <Text className="text-foreground text-xl font-interSemiBold mx-5">
          {getFirstName(fullName)}&apos;s Listings
        </Text>

        {isLoading ? (
          <View className="items-center justify-center py-6">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : landlordListings.length === 0 ? (
          <View className="py-6">
            <Text className="text-gray-500 font-inter">No listings yet.</Text>
          </View>
        ) : (
          <FlatList
            data={landlordListings}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={{ paddingHorizontal: 16, gap: 8 }}
            contentContainerStyle={{
              paddingBottom: 16,
              gap: 16,
              marginTop: 12,
            }}
            renderItem={({ item }) => (
              <ApartmentCard
                {...item}
                isGrid={true}
                onPress={() => router.push(`/apartment/${item.id}`)}
              />
            )}
          />
        )}
      </View>

      {/* Report Button */}
      <View
        className="mt-20 mx-5 flex items-center justify-center
      "
      >
        <TouchableOpacity
          activeOpacity={0.7}
          className="flex-row items-center justify-center gap-2"
          onPress={handleReportLandlord}
        >
          <Flag size={26} color={colors.danger} />
          <Text className="text-danger text-lg font-interMedium">
            Report {getFirstName(fullName)}
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}
