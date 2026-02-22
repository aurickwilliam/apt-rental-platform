import { TouchableOpacity, View } from 'react-native'
import { useEffect, useState } from 'react';

import {
  IconLayoutGrid,
  IconLayoutList
} from "@tabler/icons-react-native";

import ScreenWrapper from "components/layout/ScreenWrapper";
import StandardHeader from 'components/layout/StandardHeader';
import ApartmentCard from 'components/display/ApartmentCard';

import { COLORS } from "@repo/constants"

export default function TenantFavorites() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    setViewMode('grid');
  }, [])

  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  }

  // Icon to toggle view mode
  const ToggleFavoritesView = (
    <TouchableOpacity
      activeOpacity={0.7}
      className='p-1 -mr-1'
      onPress={toggleViewMode}
    >
      {
        viewMode === 'grid'
        ? (
          <IconLayoutList 
            size={24}
            color={COLORS.white}
          />
        ) : (
          <IconLayoutGrid
            size={24}
            color={COLORS.white}
          />
        )
      }
    </TouchableOpacity>
  )

  return (
    <ScreenWrapper 
      scrollable 
      className='p-5'
      header={
        <StandardHeader 
          title='Favorites Apartment'
          rightComponent={ToggleFavoritesView}
        />
      }
      backgroundColor={COLORS.darkerWhite}
      bottomPadding={50}
    >
      <View className='flex-row flex-wrap gap-y-3'>
        <ApartmentCard
          id={1} 
          name="Apartment Name"
          location="Barangay, City"
          ratings='0.0'
          isFavorite={false}
          monthlyRent={0}
          noBedroom={0}
          noBathroom={0}
          areaSqm={0}
          isGrid={viewMode === 'grid'}
        />
        <ApartmentCard 
          id={2}
          isGrid={viewMode === 'grid'}
        />
        <ApartmentCard 
          id={3}
          isGrid={viewMode === 'grid'}
        />
        <ApartmentCard 
          id={4}
          isGrid={viewMode === 'grid'}
        />
      </View>
    </ScreenWrapper>
  );
}
