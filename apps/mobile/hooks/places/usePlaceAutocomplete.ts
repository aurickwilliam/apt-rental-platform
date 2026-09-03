import { useCallback, useEffect, useRef, useState } from 'react';

import { isPlacesEnabled, MAP_DEFAULT_COORDS } from '@/utils/mapConfig';
import {
  createPlacesSessionToken,
  fetchPlaceAutocomplete,
  fetchPlaceDetails,
  type PlaceAutocompletePrediction,
  type PlaceDetails,
} from '@/service/places/placesService';

interface UsePlaceAutocompleteOptions {
  debounceMs?: number;
  biasLat?: number | null;
  biasLng?: number | null;
  enabled?: boolean;
}

export function usePlaceAutocomplete(opts: UsePlaceAutocompleteOptions = {}) {
  const { debounceMs = 300, biasLat, biasLng, enabled = true } = opts;
  const placesEnabled = isPlacesEnabled() && enabled;

  const [input, setInput] = useState('');
  const [predictions, setPredictions] = useState<PlaceAutocompletePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionTokenRef = useRef<string>(createPlacesSessionToken());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const refreshSessionToken = useCallback(() => {
    sessionTokenRef.current = createPlacesSessionToken();
  }, []);

  const clearPredictions = useCallback(() => {
    setPredictions([]);
    setError(null);
    setLoading(false);
  }, []);

  const search = useCallback(
    async (query: string) => {
      if (!placesEnabled) return;
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        clearPredictions();
        return;
      }
      const id = ++requestIdRef.current;
      setLoading(true);
      setError(null);
      try {
        const results = await fetchPlaceAutocomplete(trimmed, sessionTokenRef.current, {
          lat: biasLat ?? MAP_DEFAULT_COORDS.latitude,
          lng: biasLng ?? MAP_DEFAULT_COORDS.longitude,
        });
        if (id === requestIdRef.current) {
          setPredictions(results);
        }
      } catch (e) {
        if (id === requestIdRef.current) {
          setError(e instanceof Error ? e.message : 'Failed to fetch places');
          setPredictions([]);
        }
      } finally {
        if (id === requestIdRef.current) setLoading(false);
      }
    },
    [biasLat, biasLng, clearPredictions, placesEnabled],
  );

  // Debounced effect on input
  useEffect(() => {
    if (!placesEnabled) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void search(input);
    }, debounceMs);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input, debounceMs, placesEnabled, search]);

  const getDetails = useCallback(
    async (placeId: string): Promise<PlaceDetails> => {
      if (!placesEnabled) throw new Error('Places disabled');
      const details = await fetchPlaceDetails(placeId, sessionTokenRef.current);
      // New session after place_details completes (per Google billing docs: session ends after details)
      refreshSessionToken();
      // Clear list after selection
      setPredictions([]);
      setInput(details.formattedAddress);
      return details;
    },
    [placesEnabled, refreshSessionToken],
  );

  return {
    placesEnabled,
    input,
    setInput,
    predictions,
    loading,
    error,
    getDetails,
    refreshSessionToken,
    clearPredictions,
    sessionToken: sessionTokenRef.current,
  };
}
