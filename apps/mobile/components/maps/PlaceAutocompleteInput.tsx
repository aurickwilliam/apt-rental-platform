import { useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  Pressable,
} from "react-native";

import { Input, FieldError, ListGroup, Separator } from "heroui-native";
import { IconClock, IconMapPin, IconX } from "@tabler/icons-react-native";

import { usePlaceAutocomplete } from "@/hooks/places/usePlaceAutocomplete";
import { useRecentPlaceSearches } from "@/hooks/places/useRecentPlaceSearches";
import { useProfile } from "@/hooks/auth";
import { useColors } from "@/hooks/useTheme";
import type { PlaceDetails } from "@/service/places/placesService";
import type { RecentPlaceSearch } from "@/service/places/recentPlaceSearches";

interface Props {
  biasLat?: number | null;
  biasLng?: number | null;
  onSelectPlace: (details: PlaceDetails) => void;
  error?: string;
}

// Shorter than this, the box shows recent searches instead of suggestions.
const MIN_QUERY_LENGTH = 2;

export default function PlaceAutocompleteInput({
  biasLat,
  biasLng,
  onSelectPlace,
  error,
}: Props) {
  const { colors } = useColors();
  const { profile } = useProfile();
  const {
    placesEnabled,
    input,
    setInput,
    predictions,
    loading,
    error: placesError,
    getDetails,
  } = usePlaceAutocomplete({ biasLat, biasLng });
  const { recent, remember, clear } = useRecentPlaceSearches(profile?.user_id);

  const [focused, setFocused] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selectError, setSelectError] = useState<string | null>(null);

  if (!placesEnabled) return null;

  const handleSelect = async (place: RecentPlaceSearch) => {
    Keyboard.dismiss();
    setFocused(false);
    setSelecting(true);
    setSelectError(null);
    try {
      const details = await getDetails(place.placeId);
      remember(place);
      onSelectPlace(details);
    } catch (e) {
      setSelectError(e instanceof Error ? e.message : "Failed to load place");
    } finally {
      setSelecting(false);
    }
  };

  const showRecent =
    focused && input.trim().length < MIN_QUERY_LENGTH && recent.length > 0;
  const showPredictions = focused && !showRecent && predictions.length > 0;

  const items: RecentPlaceSearch[] = showRecent
    ? recent
    : predictions.map((p) => ({
        placeId: p.placeId,
        mainText: p.mainText,
        secondaryText: p.secondaryText ?? "",
      }));

  return (
    <View className="gap-1.5">
      <View className="relative">
        <Input
          placeholder="Search address (e.g. Samson Rd, Caloocan)"
          accessibilityLabel="Search address"
          value={input}
          onChangeText={setInput}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="search"
          className="pr-11"
        />
        <View className="absolute right-0 top-0 bottom-0 w-11 items-center justify-center">
          {loading || selecting ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            input.length > 0 && (
              <Pressable
                onPress={() => setInput("")}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                className="h-6 w-6 items-center justify-center rounded-full bg-surface-tertiary"
              >
                <IconX size={14} color={colors.textSecondary} />
              </Pressable>
            )
          )}
        </View>
      </View>
      {placesError && (
        <FieldError className="text-xs text-danger">{placesError}</FieldError>
      )}
      {selectError && (
        <FieldError className="text-xs text-danger">{selectError}</FieldError>
      )}
      {error && (
        <FieldError className="text-xs text-danger">{error}</FieldError>
      )}

      {(showRecent || showPredictions) && (
        <ListGroup className="mt-1 max-h-72 overflow-hidden">
          {showRecent && (
            <View className="flex-row items-center justify-between px-4 pt-3 pb-1">
              <Text className="text-sm font-nunitoSemiBold text-muted">
                Recent Searches
              </Text>
              <Pressable
                onPress={clear}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Clear recent searches"
              >
                <Text className="text-sm font-nunitoSemiBold text-primary">
                  Clear
                </Text>
              </Pressable>
            </View>
          )}
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {items.map((item, index) => (
              <View key={item.placeId}>
                {index > 0 && <Separator className="mx-4" />}
                <ListGroup.Item onPress={() => void handleSelect(item)}>
                  <ListGroup.ItemPrefix>
                    {showRecent ? (
                      <IconClock size={20} color={colors.textSecondary} />
                    ) : (
                      <IconMapPin size={20} color={colors.textSecondary} />
                    )}
                  </ListGroup.ItemPrefix>
                  <ListGroup.ItemContent>
                    <ListGroup.ItemTitle numberOfLines={1}>
                      {item.mainText}
                    </ListGroup.ItemTitle>
                    {!!item.secondaryText && (
                      <ListGroup.ItemDescription numberOfLines={1}>
                        {item.secondaryText}
                      </ListGroup.ItemDescription>
                    )}
                  </ListGroup.ItemContent>
                </ListGroup.Item>
              </View>
            ))}
          </ScrollView>
        </ListGroup>
      )}
    </View>
  );
}
