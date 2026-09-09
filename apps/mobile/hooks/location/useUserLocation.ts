import { useEffect, useState } from 'react';

export type UserLocationStatus = 'loading' | 'granted' | 'denied';

export interface UserCoords {
  latitude: number;
  longitude: number;
}

/**
 * Single-screen hook for the map-search blue dot + recenter-to-me.
 * Requests foreground permission on mount, then fetches a one-shot position.
 * No watchPosition — keeps battery cost at one fix per screen visit.
 */
export function useUserLocation(enabled = true) {
  const [coords, setCoords] = useState<UserCoords | null>(null);
  const [status, setStatus] = useState<UserLocationStatus>('loading');

  useEffect(() => {
    if (!enabled) {
      setStatus('denied');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        // Dynamic import so the app doesn't crash on a stale binary without the native module
        const Location = await import('expo-location');
        const { status: perm } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (perm !== 'granted') {
          setStatus('denied');
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setStatus('granted');
      } catch {
        if (!cancelled) setStatus('denied');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { coords, status };
}
