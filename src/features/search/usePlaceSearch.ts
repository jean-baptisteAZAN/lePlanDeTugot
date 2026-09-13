import { useCallback, useEffect, useRef, useState } from 'react';

import {
  autocomplete,
  getPlaceDetails,
  newSessionToken,
  type PlaceDetails,
  type PlaceSuggestion,
} from '@/features/search/googlePlaces';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export function usePlaceSearch() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionToken = useRef(newSessionToken());

  useEffect(() => {
    const input = query.trim();
    if (input.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setLoading(false);
      setError(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(() => {
      autocomplete(input, sessionToken.current, controller.signal)
        .then((results) => {
          if (controller.signal.aborted) return;
          setSuggestions(results);
          setError(null);
          setLoading(false);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setError('Recherche indisponible, réessaie');
          setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const select = useCallback(async (placeId: string): Promise<PlaceDetails> => {
    const details = await getPlaceDetails(placeId, sessionToken.current);
    sessionToken.current = newSessionToken();
    return details;
  }, []);

  return { query, setQuery, suggestions, loading, error, select };
}
