export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type Viewport = {
  low: Coordinates;
  high: Coordinates;
};

export type City = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  viewport: Viewport;
  googlePlaceId: string | null;
};

export type CityInput = Omit<City, 'id'>;
