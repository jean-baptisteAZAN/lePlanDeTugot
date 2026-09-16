import { useCallback, useEffect, useRef, useState } from 'react';

import { newSessionToken, type PlaceSuggestion } from '@/features/search/googlePlaces';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export type SuggestFn = (input: string, sessionToken: string, signal: AbortSignal) => Promise<PlaceSuggestion[]>;

export type DetailsFn<T> = (placeId: string, sessionToken: string) => Promise<T>;

export function useGoogleSearch<T>(suggest: SuggestFn, details: DetailsFn<T>) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionToken = useRef(newSessionToken());
  const latest = useRef({ suggest, details });

  useEffect(() => {
    latest.current = { suggest, details };
  });

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
      latest.current
        .suggest(input, sessionToken.current, controller.signal)
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

  const select = useCallback(async (placeId: string): Promise<T> => {
    const value = await latest.current.details(placeId, sessionToken.current);
    sessionToken.current = newSessionToken();
    return value;
  }, []);

  return { query, setQuery, suggestions, loading, error, select };
}
