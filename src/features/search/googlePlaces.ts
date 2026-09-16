import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';

import type { CityInput, Viewport } from '@/features/cities/types';
import { env } from '@/lib/env';

export const BASE_URL = 'https://places.googleapis.com/v1';
const DETAILS_FIELD_MASK = 'id,displayName,formattedAddress,location,types,primaryType';
const CITY_DETAILS_FIELD_MASK = 'id,displayName,location,viewport';
const FALLBACK_VIEWPORT_DELTA = 0.05;

export type PlaceSuggestion = {
  placeId: string;
  mainText: string;
  secondaryText: string;
};

export type PlaceDetails = {
  googlePlaceId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  primaryType: string | null;
  types: string[];
};

export type SearchBias = {
  center: { latitude: number; longitude: number };
  radius: number;
};

type AutocompleteResponse = {
  suggestions?: {
    placePrediction?: {
      placeId: string;
      text?: { text: string };
      structuredFormat?: {
        mainText?: { text: string };
        secondaryText?: { text: string };
      };
    };
  }[];
};

type DetailsResponse = {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  types?: string[];
  primaryType?: string;
};

type CityDetailsResponse = {
  id: string;
  displayName?: { text: string };
  location?: { latitude: number; longitude: number };
  viewport?: Viewport;
};

export function newSessionToken(): string {
  return Crypto.randomUUID();
}

export function buildHeaders(fieldMask?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': env.googlePlacesApiKey,
  };
  const bundleIdentifier = Constants.expoConfig?.ios?.bundleIdentifier;
  if (bundleIdentifier) {
    headers['X-Ios-Bundle-Identifier'] = bundleIdentifier;
  }
  if (fieldMask) {
    headers['X-Goog-FieldMask'] = fieldMask;
  }
  return headers;
}

async function requestSuggestions(body: Record<string, unknown>, signal?: AbortSignal): Promise<PlaceSuggestion[]> {
  const response = await fetch(`${BASE_URL}/places:autocomplete`, {
    method: 'POST',
    signal,
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Places autocomplete failed: ${response.status}`);
  }
  const json = (await response.json()) as AutocompleteResponse;
  return (json.suggestions ?? []).flatMap((suggestion) => {
    const prediction = suggestion.placePrediction;
    if (!prediction) return [];
    return [
      {
        placeId: prediction.placeId,
        mainText: prediction.structuredFormat?.mainText?.text ?? prediction.text?.text ?? '',
        secondaryText: prediction.structuredFormat?.secondaryText?.text ?? '',
      },
    ];
  });
}

export function autocomplete(
  input: string,
  sessionToken: string,
  bias: SearchBias,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  return requestSuggestions({ input, sessionToken, languageCode: 'fr', locationBias: { circle: bias } }, signal);
}

export function autocompleteCities(
  input: string,
  sessionToken: string,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  return requestSuggestions({ input, sessionToken, languageCode: 'fr', includedPrimaryTypes: ['(cities)'] }, signal);
}

function detailsUrl(placeId: string, sessionToken: string): string {
  return (
    `${BASE_URL}/places/${encodeURIComponent(placeId)}` +
    `?sessionToken=${encodeURIComponent(sessionToken)}&languageCode=fr`
  );
}

export async function getPlaceDetails(placeId: string, sessionToken: string): Promise<PlaceDetails> {
  const response = await fetch(detailsUrl(placeId, sessionToken), { headers: buildHeaders(DETAILS_FIELD_MASK) });
  if (!response.ok) {
    throw new Error(`Places details failed: ${response.status}`);
  }
  const json = (await response.json()) as DetailsResponse;
  if (!json.location) {
    throw new Error('Place has no location');
  }
  return {
    googlePlaceId: json.id,
    name: json.displayName?.text ?? '',
    address: json.formattedAddress ?? '',
    lat: json.location.latitude,
    lng: json.location.longitude,
    primaryType: json.primaryType ?? null,
    types: json.types ?? [],
  };
}

export async function getCityDetails(placeId: string, sessionToken: string): Promise<CityInput> {
  const response = await fetch(detailsUrl(placeId, sessionToken), { headers: buildHeaders(CITY_DETAILS_FIELD_MASK) });
  if (!response.ok) {
    throw new Error(`Places city details failed: ${response.status}`);
  }
  const json = (await response.json()) as CityDetailsResponse;
  if (!json.location) {
    throw new Error('City has no location');
  }
  const { latitude, longitude } = json.location;
  return {
    name: json.displayName?.text ?? '',
    lat: latitude,
    lng: longitude,
    viewport: json.viewport ?? {
      low: { latitude: latitude - FALLBACK_VIEWPORT_DELTA, longitude: longitude - FALLBACK_VIEWPORT_DELTA },
      high: { latitude: latitude + FALLBACK_VIEWPORT_DELTA, longitude: longitude + FALLBACK_VIEWPORT_DELTA },
    },
    googlePlaceId: json.id,
  };
}
