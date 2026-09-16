import { cityBiasCircle } from '@/features/cities/cities';
import type { City } from '@/features/cities/types';
import { autocomplete, getPlaceDetails, type PlaceDetails } from '@/features/search/googlePlaces';
import { SearchPanel } from '@/features/search/SearchPanel';

type Props = {
  city: City;
  onSelect: (details: PlaceDetails) => void;
  onCancel?: () => void;
};

export function PlaceSearch({ city, onSelect, onCancel }: Props) {
  const bias = cityBiasCircle(city);

  return (
    <SearchPanel
      placeholder="Nom ou adresse (ex : Le Comptoir)"
      selectErrorMessage="Impossible de récupérer ce lieu, réessaie."
      suggest={(input, sessionToken, signal) => autocomplete(input, sessionToken, bias, signal)}
      details={getPlaceDetails}
      onSelect={onSelect}
      onCancel={onCancel}
    />
  );
}
