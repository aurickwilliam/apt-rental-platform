import {View, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator, Text} from 'react-native'
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';

import {
  IconMapPinFilled,
  IconChevronDown,
  IconChevronUp,
  IconLayoutGrid
} from "@tabler/icons-react-native";

import ScreenWrapper from 'components/layout/ScreenWrapper'
import DropdownButton from 'components/buttons/DropdownButton';
import SearchField from 'components/inputs/SearchField';
import ApartmentCard from 'components/display/ApartmentCard';

import { COLORS } from '@repo/constants';
import { supabase } from '@repo/supabase';

export default function Search() {
  const router = useRouter();

  // List of City Location
  const cities = [
    'All',
    'Caloocan',
    'Malabon',
    'Navotas',
    'Valenzuela',
  ];

  const [apartments, setApartments] = useState<ApartmentCardProps[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>(cities[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchApartments = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('apartments')
        .select('id, name, barangay, city, average_rating, monthly_rent, no_bedrooms, no_bathrooms, area_sqm')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      // Filter by city
      if (selectedCity && selectedCity !== 'All') {
        query = query.eq('city', selectedCity);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching apartments:', error);
        return;
      }

      // Transform Supabase data to ApartmentCardProps
      const transformedData: ApartmentCardProps[] = (data || []).map((apartment) => ({
        id: parseInt(apartment.id),
        thumbnail: undefined, // Will need to fetch from apartment_images table separately if needed
        name: apartment.name,
        location: `${apartment.barangay}, ${apartment.city}`,
        ratings: apartment.average_rating?.toString() || '0.0',
        isFavorite: false, // Will need user preferences from database
        monthlyRent: apartment.monthly_rent,
        noBedroom: apartment.no_bedrooms,
        noBathroom: apartment.no_bathrooms,
        areaSqm: apartment.area_sqm,
        isGrid: true,
      }));

      setApartments(transformedData);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApartments();
  }, [selectedCity]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchApartments();
  };

  // Filter apartments by search query
  const filteredApartments = apartments.filter(apt =>
    apt.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    apt.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFavorite = (id: number) => {
    console.log('Toggling favorite for apartment ID:', id);

    setApartments(prevData =>
      prevData.map(apartment =>
        apartment.id === id
          ? { ...apartment, isFavorite: !apartment.isFavorite }
          : apartment
      )
    );
  };

  // Handle navigation to apartment details
  const handleApartmentPress = (apartmentId: number) => {
    router.push(`/apartment/${apartmentId}`);
  }

  const renderApartmentCard = ({ item }: { item: ApartmentCardProps }) => (
    <ApartmentCard
      {...item}
      isGrid={true}
      onPress={() => handleApartmentPress(item.id)}
      onPressFavorite={() => toggleFavorite(item.id)}
    />
  );

  const renderEmptyState = () => (
    <View className='flex-1 items-center justify-center py-10'>
      <Text className='text-lg text-grey-500 font-poppinsMedium'>
        No apartments found
      </Text>
    </View>
  );

  return (
    <ScreenWrapper
      className='py-5'
      backgroundColor={COLORS.darkerWhite}
    >
      <View className='flex-row items-center justify-between mb-6 px-5'>
        <View className='flex-row gap-2'>
          <IconMapPinFilled
            size={30}
            color={COLORS.primary}
          />

          {/* Filter Location */}
          <DropdownButton
            bottomSheetLabel="Select Location"
            options={cities}
            value={selectedCity}
            onSelect={(value) => setSelectedCity(value)}
            textClassName='text-2xl text-text font-poppinsSemiBold leading-[34px]'
            buttonClassName='bg-transparent flex-row items-center justify-center gap-1'
            openIcon={IconChevronUp}
            closeIcon={IconChevronDown}
          />
        </View>

        {/* Change View Mode */}
        <TouchableOpacity
          activeOpacity={0.7}
        >
          <IconLayoutGrid
            size={26}
            color={COLORS.grey}
          />
        </TouchableOpacity>
      </View>

      <View className='px-5 mb-5'>
        <SearchField
          searchValue={searchQuery}
          onChangeSearch={setSearchQuery}
          showFilterButton
        />
      </View>

      {loading && !refreshing ? (
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredApartments}
          renderItem={renderApartmentCard}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={{ paddingHorizontal: 16, gap: 8 }}
          scrollEnabled={true}
          contentContainerStyle={{ paddingBottom: 16, gap: 16 }}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </ScreenWrapper>
  )
}
