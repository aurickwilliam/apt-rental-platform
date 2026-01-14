import { Text, TouchableOpacity } from 'react-native'
import { useState } from 'react';

import {
  IconLayoutGrid,
  IconLayoutList
} from "@tabler/icons-react-native";

import ScreenWrapper from "@/components/ScreenWrapper";
import StandardHeader from '@/components/StandardHeader';

import { COLORS } from "../constants/colors"

export default function TenantFavorites() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
          <IconLayoutGrid 
            size={24}
            color={COLORS.white}
          />
        ) : (
          <IconLayoutList 
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
      headerBackgroundColor={COLORS.primary}
    >
      <Text>
        Favorites
      </Text>
    </ScreenWrapper>
  );
}
