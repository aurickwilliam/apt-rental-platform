import { View, Text, TouchableOpacity, FlatList } from 'react-native'

import { ApartmentCardProps } from '../../types';

import ApartmentCard from "./ApartmentCard";

interface ApartmentListProps {
  label?: string;
  apartmentData: ApartmentCardProps[];
  onSeeAllPress?: () => void;
  onToggleFavorite: (id: number) => void;
  onApartmentPress: (id: number) => void;
}

export default function ApartmentHorizontalListCard({
  label = 'Recommended Apartments',
  apartmentData = [],
  onSeeAllPress,
  onToggleFavorite,
  onApartmentPress
}: ApartmentListProps) {

  return (
    <View className='mt-8'>
      {/* Title */}
      <View className='flex-row items-center justify-between mb-4 px-5'>
        <Text className='text-text text-lg font-poppinsSemiBold'>
          {label}
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onSeeAllPress}
        >
          <Text className='text-primary text-base font-poppins'>
            See All
          </Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal List */}
      <FlatList
        className='px-3'
        horizontal
        showsHorizontalScrollIndicator={false}
        data={apartmentData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ApartmentCard
            id={item.id}
            name={item.name}
            monthlyRent={item.monthlyRent}
            areaSqm={item.areaSqm}
            noBathroom={item.noBathroom}
            noBedroom={item.noBedroom}
            location={item.location}
            isFavorite={item.isFavorite}
            onPress={() => onApartmentPress(item.id)}
            onPressFavorite={() => onToggleFavorite(item.id)}
          />
        )}
      />
    </View>
  )
}
