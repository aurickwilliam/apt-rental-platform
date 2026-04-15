import { View, Text, TouchableOpacity, Alert } from 'react-native'
import { useState, useEffect } from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import Divider from '@/components/display/Divider'
import PillButton from '@/components/buttons/PillButton'
import DropdownField from '@/components/inputs/DropdownField'
import NumberField from '@/components/inputs/NumberField'

import {
  IconCirclePlus,
  IconCircleMinus
} from '@tabler/icons-react-native'

import { APARTMENT_TYPES, COLORS, FLOOR_LEVELS, FURNISHED_TYPES, LEASE_DURATIONS } from '@repo/constants'
import { supabase } from '@repo/supabase'

export default function EditSpecs() {
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams();
  const id = Array.isArray(apartmentId) ? apartmentId[0] : apartmentId;

  const [propertyType, setPropertyType] = useState<string>('');
  const [floorArea, setFloorArea] = useState<string>('');
  const [furnishedType, setFurnishedType] = useState<string>('');
  const [floorLevel, setFloorLevel] = useState<string>('');
  const [leaseDuration, setLeaseDuration] = useState<string>('');
  const [bathrooms, setBathrooms] = useState<number>(1);
  const [bedrooms, setBedrooms] = useState<number>(1);
  const [maxOccupants, setMaxOccupants] = useState<number>(1);

  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(true);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const maxValue = 10;
  const minValue = 1;

  // Fetch existing apartment specs on mount
  useEffect(() => {
    const fetchSpecs = async () => {
      const { data, error } = await supabase
        .from('apartments')
        .select('type, area_sqm, furnished_type, floor_level, lease_duration, no_bathrooms, no_bedrooms, max_occupants')
        .eq('id', id)
        .single();

      if (error) {
        Alert.alert('Error', 'Failed to load apartment details.');
        console.error(error);
      } else if (data) {
        setPropertyType(data.type ?? '');
        setFloorArea(data.area_sqm ? String(data.area_sqm) : '');
        setFurnishedType(data.furnished_type ?? '');
        setFloorLevel(data.floor_level ?? '');
        setLeaseDuration(data.lease_duration ?? '');
        setBathrooms(data.no_bathrooms ?? 1);
        setBedrooms(data.no_bedrooms ?? 1);
        setMaxOccupants(data.max_occupants ?? 1);
      }

      setFetching(false);
    };

    fetchSpecs();
  }, [id]);

  const handleAdd = (type: 'bathrooms' | 'bedrooms' | 'maxOccupants') => {
    if (type === 'bathrooms') setBathrooms(prev => Math.min(prev + 1, maxValue));
    if (type === 'bedrooms') setBedrooms(prev => Math.min(prev + 1, maxValue));
    if (type === 'maxOccupants') setMaxOccupants(prev => Math.min(prev + 1, maxValue));
  };

  const handleSubtract = (type: 'bathrooms' | 'bedrooms' | 'maxOccupants') => {
    if (type === 'bathrooms') setBathrooms(prev => Math.max(prev - 1, minValue));
    if (type === 'bedrooms') setBedrooms(prev => Math.max(prev - 1, minValue));
    if (type === 'maxOccupants') setMaxOccupants(prev => Math.max(prev - 1, minValue));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!propertyType) newErrors.propertyType = 'Property type is required.';
    if (!floorArea || isNaN(Number(floorArea))) newErrors.floorArea = 'Valid floor area is required.';
    if (!furnishedType) newErrors.furnishedType = 'Furnished type is required.';
    if (!floorLevel) newErrors.floorLevel = 'Floor level is required.';
    if (!leaseDuration) newErrors.leaseDuration = 'Lease duration is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = async () => {
    if (!validate()) return;

    setLoading(true);

    const { error } = await supabase
      .from('apartments')
      .update({
        type: propertyType,
        area_sqm: Number(floorArea),
        furnished_type: furnishedType,
        floor_level: floorLevel,
        lease_duration: leaseDuration,
        no_bathrooms: bathrooms,
        no_bedrooms: bedrooms,
        max_occupants: maxOccupants,
      })
      .eq('id', id);

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Failed to save changes. Please try again.');
      console.error(error);
      return;
    }

    router.replace(`/manage-apartment/${id}/description`);
  };

  if (fetching) return null;

  return (
    <ScreenWrapper
      className='p-5'
      header={
        <StandardHeader title='Edit Room/Unit Details' />
      }
    >
      <View className='flex gap-3'>
        <DropdownField
          label='Property Type:'
          required
          placeholder='Select property type'
          options={APARTMENT_TYPES}
          bottomSheetLabel={'Select Apartment Type'}
          value={propertyType}
          error={errors.propertyType ?? ''}
          onSelect={(val) => setPropertyType(val)}
        />

        <NumberField
          label='Floor Area (sqm):'
          required
          placeholder='Enter floor area'
          value={floorArea}
          error={errors.floorArea ?? ''}
          onChange={(val) => setFloorArea(val)}
        />

        <DropdownField
          label='Furnished Type:'
          required
          placeholder='Select furnishing type'
          options={FURNISHED_TYPES}
          bottomSheetLabel={'Select Furnishing Type'}
          value={furnishedType}
          error={errors.furnishedType ?? ''}
          onSelect={(val) => setFurnishedType(val)}
        />

        <DropdownField
          label='Floor Level:'
          required
          placeholder='Select floor level'
          options={FLOOR_LEVELS}
          bottomSheetLabel={'Select Floor Level'}
          value={floorLevel}
          error={errors.floorLevel ?? ''}
          onSelect={(val) => setFloorLevel(val)}
        />

        <DropdownField
          label='Lease Duration:'
          required
          placeholder='Select lease duration'
          options={LEASE_DURATIONS}
          bottomSheetLabel={'Select Lease Duration'}
          value={leaseDuration}
          error={errors.leaseDuration ?? ''}
          onSelect={(val) => setLeaseDuration(val)}
        />
      </View>

      <Divider marginVertical={30} />

      {/* Bathrooms */}
      <View className='flex-row items-center justify-between mt-5'>
        <Text className='text-text text-lg font-interMedium'>Bathrooms:</Text>
        <View className='flex-row items-center gap-7'>
          <TouchableOpacity
            onPress={() => handleSubtract('bathrooms')}
            disabled={bathrooms <= minValue}
            style={{ opacity: bathrooms <= minValue ? 0.3 : 1 }}
          >
            <IconCircleMinus size={30} color={COLORS.text} />
          </TouchableOpacity>
          <Text className='text-text text-xl font-interMedium'>{bathrooms}</Text>
          <TouchableOpacity onPress={() => handleAdd('bathrooms')}>
            <IconCirclePlus size={30} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bedrooms */}
      <View className='flex-row items-center justify-between mt-5'>
        <Text className='text-text text-lg font-interMedium'>Bedrooms:</Text>
        <View className='flex-row items-center gap-7'>
          <TouchableOpacity
            onPress={() => handleSubtract('bedrooms')}
            disabled={bedrooms <= minValue}
            style={{ opacity: bedrooms <= minValue ? 0.3 : 1 }}
          >
            <IconCircleMinus size={30} color={COLORS.text} />
          </TouchableOpacity>
          <Text className='text-text text-xl font-interMedium'>{bedrooms}</Text>
          <TouchableOpacity onPress={() => handleAdd('bedrooms')}>
            <IconCirclePlus size={30} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Max Occupants */}
      <View className='flex-row items-center justify-between mt-5'>
        <Text className='text-text text-lg font-interMedium'>Max Occupants:</Text>
        <View className='flex-row items-center gap-7'>
          <TouchableOpacity
            onPress={() => handleSubtract('maxOccupants')}
            disabled={maxOccupants <= minValue}
            style={{ opacity: maxOccupants <= minValue ? 0.3 : 1 }}
          >
            <IconCircleMinus size={30} color={COLORS.text} />
          </TouchableOpacity>
          <Text className='text-text text-xl font-interMedium'>{maxOccupants}</Text>
          <TouchableOpacity onPress={() => handleAdd('maxOccupants')}>
            <IconCirclePlus size={30} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View className='flex-1' />

      <PillButton
        label={loading ? 'Saving...' : 'Save Changes'}
        onPress={handleSaveChanges}
        isDisabled={loading}
      />

    </ScreenWrapper>
  );
}