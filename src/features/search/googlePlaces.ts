import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';

import { env } from '@/lib/env';

const BASE_URL = 'https://places.googleapis.com/v1';
const PARIS_CENTER = { latitude: 48.8566, longitude: 2.3522 };
const DETAILS_FIELD_MASK = 'id,displayName,formattedAddress,location,types,primaryType';

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

export function newSessionToken(): string {
  return Crypto.randomUUID();
}

function buildHeaders(fieldMask?: string): Record<string, string> {
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

export async function autocomplete(
  input: string,
  sessionToken: string,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  const response = await fetch(`${BASE_URL}/places:autocomplete`, {
    method: 'POST',
    signal,
    headers: buildHeaders(),
    body: JSON.stringify({
      input,
      sessionToken,
      languageCode: 'fr',
      includedRegionCodes: ['fr'],
      locationBias: { circle: { center: PARIS_CENTER, radius: 15000 } },
    }),
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

export async function getPlaceDetails(placeId: string, sessionToken: string): Promise<PlaceDetails> {
  const url =
    `${BASE_URL}/places/${encodeURIComponent(placeId)}` +
    `?sessionToken=${encodeURIComponent(sessionToken)}&languageCode=fr`;
  const response = await fetch(url, { headers: buildHeaders(DETAILS_FIELD_MASK) });
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
