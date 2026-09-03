import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';

import { Input, Label, FieldError } from 'heroui-native';

import { usePlaceAutocomplete } from '@/hooks/places/usePlaceAutocomplete';
import { useColors } from '@/hooks/useTheme';

interface Props {
  biasLat?: number | null;
  biasLng?: number | null;
  onSelectPlace: (details: import('@/service/places/placesService').PlaceDetails) => void;
  error?: string;
}

export default function PlaceAutocompleteInput({ biasLat, biasLng, onSelectPlace, error }: Props) {
  const { colors } = useColors();
  const {
    placesEnabled,
    input,
    setInput,
    predictions,
    loading,
    error: placesError,
    getDetails,
  } = usePlaceAutocomplete({ biasLat, biasLng });

  const [selecting, setSelecting] = useState(false);
  const [selectError, setSelectError] = useState<string | null>(null);

  if (!placesEnabled) return null;

  const handleSelect = async (placeId: string) => {
    setSelecting(true);
    setSelectError(null);
    try {
      const details = await getDetails(placeId);
      onSelectPlace(details);
    } catch (e) {
      setSelectError(e instanceof Error ? e.message : 'Failed to load place');
    } finally {
      setSelecting(false);
    }
  };

  return (
    <View className="gap-1.5">
      <Label className="text-sm font-medium text-foreground">Search address</Label>
      <View className="relative">
        <Input
          placeholder="Type Samson Rd, Caloocan…"
          value={input}
          onChangeText={setInput}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="search"
        />
        {(loading || selecting) && (
          <View className="absolute right-3 top-3">
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
      </View>
      {placesError && <FieldError className="text-xs text-danger">{placesError}</FieldError>}
      {selectError && <FieldError className="text-xs text-danger">{selectError}</FieldError>}
      {error && <FieldError className="text-xs text-danger">{error}</FieldError>}

      {predictions.length > 0 && (
        <View className="mt-1 rounded-2xl border border-border bg-surface overflow-hidden max-h-56">
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {predictions.map((p) => (
              <TouchableOpacity
                key={p.placeId}
                activeOpacity={0.7}
                onPress={() => void handleSelect(p.placeId)}
                className="px-3 py-3 border-b border-border last:border-b-0"
              >
                <Text className="text-sm font-nunitoSemiBold text-foreground" numberOfLines={1}>
                  {p.mainText}
                </Text>
                {!!p.secondaryText && (
                  <Text className="text-xs text-muted font-inter mt-0.5" numberOfLines={1}>
                    {p.secondaryText}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View className="px-3 py-1.5 bg-surface-secondary">
            <Text className="text-[10px] text-muted font-inter text-right">Powered by Google</Text>
          </View>
        </View>
      )}

      <Text className="text-xs text-muted font-inter">
        Tip: tap a suggestion to auto-fill street/barangay/city and move the pin. You can still drag the pin after.
      </Text>
    </View>
  );
}
